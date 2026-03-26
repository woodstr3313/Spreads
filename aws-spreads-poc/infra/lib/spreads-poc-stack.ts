import * as path from 'path';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class SpreadsPocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const spreadsTable = new dynamodb.Table(this, 'SpreadsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    spreadsTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING }
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true }
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool
    });

    const commonLambdaProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        SPREADS_TABLE_NAME: spreadsTable.tableName,
        DOCUMENTS_BUCKET_NAME: documentsBucket.bucketName
      }
    };

    const ingestionStartFn = new lambda.Function(this, 'IngestionStartFn', {
      ...commonLambdaProps,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'ingestion_start'))
    });

    const textractCompleteFn = new lambda.Function(this, 'TextractCompleteFn', {
      ...commonLambdaProps,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'textract_complete'))
    });

    const reviewCallbackFn = new lambda.Function(this, 'ReviewCallbackFn', {
      ...commonLambdaProps,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'review_callback'))
    });

    const apiFn = new lambda.Function(this, 'ApiFn', {
      ...commonLambdaProps,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'api')),
      environment: {
        ...commonLambdaProps.environment,
        INGESTION_STATE_MACHINE_ARN: ''
      }
    });

    spreadsTable.grantReadWriteData(ingestionStartFn);
    spreadsTable.grantReadWriteData(textractCompleteFn);
    spreadsTable.grantReadWriteData(reviewCallbackFn);
    spreadsTable.grantReadWriteData(apiFn);
    documentsBucket.grantReadWrite(ingestionStartFn);
    documentsBucket.grantRead(textractCompleteFn);
    documentsBucket.grantReadWrite(apiFn);

    ingestionStartFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['textract:AnalyzeDocument', 'textract:StartDocumentAnalysis', 'textract:GetDocumentAnalysis'],
        resources: ['*']
      })
    );

    const reviewTask = new tasks.LambdaInvoke(this, 'CreateReviewTask', {
      lambdaFunction: textractCompleteFn,
      payload: stepfunctions.TaskInput.fromObject({
        ...stepfunctions.JsonPath.entirePayload,
        reviewToken: stepfunctions.JsonPath.taskToken,
        reviewRequired: true
      }),
      integrationPattern: stepfunctions.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      outputPath: '$.Payload'
    });

    const startIngestion = new tasks.LambdaInvoke(this, 'StartIngestion', {
      lambdaFunction: ingestionStartFn,
      outputPath: '$.Payload'
    });

    const extractionAndMapping = new tasks.LambdaInvoke(this, 'ExtractionAndMapping', {
      lambdaFunction: textractCompleteFn,
      outputPath: '$.Payload'
    });

    const approved = new stepfunctions.Succeed(this, 'SpreadReadyForReview');
    const failed = new stepfunctions.Fail(this, 'SpreadFailed');

    const definition = startIngestion
      .next(extractionAndMapping)
      .next(
        new stepfunctions.Choice(this, 'NeedsHumanReview')
          .when(stepfunctions.Condition.booleanEquals('$.reviewRequired', true), reviewTask.next(approved))
          .when(stepfunctions.Condition.stringEquals('$.workflowState', 'FAILED'), failed)
          .otherwise(approved)
      );

    const stateMachine = new stepfunctions.StateMachine(this, 'SpreadIngestionStateMachine', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
      timeout: Duration.minutes(30)
    });

    apiFn.addEnvironment('INGESTION_STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    stateMachine.grantStartExecution(apiFn);

    reviewCallbackFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
        resources: ['*']
      })
    );

    const api = new appsync.GraphqlApi(this, 'SpreadsApi', {
      name: 'spreads-poc-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, '..', '..', 'packages', 'api-schema', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool }
        }
      },
      xrayEnabled: true
    });

    const lambdaDs = api.addLambdaDataSource('LambdaDs', apiFn);

    for (const field of ['getSpreadVersion', 'getTemplateVersion', 'listReviewTasks', 'uploadDocument', 'updateCell', 'resolveReviewTask']) {
      lambdaDs.createResolver(`${field}Resolver`, {
        typeName: field.startsWith('get') || field.startsWith('list') ? 'Query' : 'Mutation',
        fieldName: field
      });
    }

    documentsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(ingestionStartFn),
      { prefix: 'uploads/' }
    );

    ingestionStartFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    stateMachine.grantStartExecution(ingestionStartFn);

    api.grantQuery(apiFn.grantPrincipal);

    this.exportValue(api.graphqlUrl, { name: 'SpreadsApiUrl' });
    this.exportValue(userPool.userPoolId, { name: 'SpreadsUserPoolId' });
    this.exportValue(userPoolClient.userPoolClientId, { name: 'SpreadsUserPoolClientId' });
    this.exportValue(documentsBucket.bucketName, { name: 'SpreadsDocumentsBucketName' });
    this.exportValue(spreadsTable.tableName, { name: 'SpreadsTableName' });
  }
}
