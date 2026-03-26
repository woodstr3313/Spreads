const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

const TABLE_NAME = process.env.SPREADS_TABLE_NAME;

function nowIso() {
  return new Date().toISOString();
}

async function putItem(item) {
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

async function getItem(pk, sk) {
  const res = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk } }));
  return res.Item;
}

async function updateItem(key, updateExpression, names, values) {
  const res = await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW'
  }));
  return res.Attributes;
}

async function queryByPk(pk, beginsWith) {
  const res = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
    ExpressionAttributeValues: { ':pk': pk, ':sk': beginsWith }
  }));
  return res.Items ?? [];
}

async function queryGsi1(gsi1pk, beginsWith = '') {
  const res = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :pk and begins_with(gsi1sk, :sk)',
    ExpressionAttributeValues: { ':pk': gsi1pk, ':sk': beginsWith }
  }));
  return res.Items ?? [];
}

module.exports = { TABLE_NAME, nowIso, putItem, getItem, updateItem, queryByPk, queryGsi1 };
