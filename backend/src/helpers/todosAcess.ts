import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('dataLayer')

const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIndexName = process.env.TODOS_CREATED_AT_INDEX

export const getTodos = async (userId: string): Promise<TodoItem[]> => {
  logger.debug(`getTodos (userId: ${userId})`)

  const result = await docClient
    .query({
      TableName: todosTable,
      IndexName: todosIndexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
    .promise()

  return result.Items as TodoItem[]
}

export const createTodo = async (todo: TodoItem): Promise<TodoItem> => {
  logger.debug(`createTodo (todo: ${todo})`)

  await docClient
    .put({
      TableName: todosTable,
      Item: todo
    })
    .promise()

  return todo
}

export async function updateTodo(
  todoId: string,
  userId: string,
  updatedTodo: TodoUpdate
) {
  logger.debug(`updateTodo (todoId: ${todoId}, todo: ${updatedTodo})`)

  await docClient
    .update({
      TableName: todosTable,
      Key: { todoId: todoId, userId: userId },
      ExpressionAttributeNames: { '#name': 'name' },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ':name': updatedTodo.name,
        ':dueDate': updatedTodo.dueDate,
        ':done': updatedTodo.done
      },
      ReturnValues: 'UPDATED_NEW'
    })
    .promise()
}

export async function setAttachmentUrl(
  todoId: string,
  userId: string,
  url: string
) {
  logger.debug(`setAttachmentUrl (todoId: ${todoId}, url: ${url})`)

  await docClient
    .update({
      TableName: todosTable,
      Key: { todoId: todoId, userId: userId },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': url
      }
    })
    .promise()
}

export async function deleteTodo(todoId: string, userId: string) {
  logger.debug(`deleteTodo (todoId: ${todoId})`)

  await docClient
    .delete({
      TableName: todosTable,
      Key: { todoId: todoId, userId: userId }
    })
    .promise()
}
