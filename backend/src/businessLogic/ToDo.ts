import { TodosAccess } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import CustomError from '../utils/error';
import { TodoUpdate } from '../models/TodoUpdate';
import { getAttachmentUrl } from './attachmentUtils'
import * as Joi from 'joi'


const todoAccess = new TodosAccess();

const logger = createLogger('Todos')

// TODO: Implement businessLogic
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  try {
    const result = await todoAccess.getAllTodos(userId);
    logger.info(`TODO items of user fetched: ${userId}`, JSON.stringify(result))
    return result;
  } catch (error) {
      logger.error('Get Todo Error', error)
      throw new CustomError(error.message, 500)
  }
}


export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const valid = createTodoSchema.validate(createTodoRequest);
  if (valid.error) {
    logger.error('VALIDATION ERROR', valid.error)
    throw new CustomError(valid.error.message, 400)
  }
  try {
    const todoItem: TodoItem = {
      todoId,
      userId,
      createdAt: new Date().toISOString(),
      done: false,
      attachmentUrl: null,
      ...createTodoRequest,
    }

    await todoAccess.createTodo(todoItem)
    logger.info('Todo created success fully', todoItem)
    return todoItem;
  } catch (error) {
    throw new CustomError(error.message, 500)
  }
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  todoId: string,
  userId: string,
): Promise<TodoItem> {

  const valid = updateTodoSchema.validate(updateTodoRequest);
  if (valid.error) {
    logger.error('VALIDATION ERROR', valid.error)
    throw new CustomError(valid.error.message, 400)
  }

  try {

    const item = await todoAccess.updateTodo(updateTodoRequest as TodoUpdate, todoId, userId)

    logger.info('TODO updated successfully', {
      userId,
      todoId,
      updated: updateTodo
    })
    return item
    
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function deleteTodo(
  todoId: string,
  userId: string,
) {
  try {

    const item = await todoAccess.deleteTodo(todoId, userId)
    logger.info('TODO deleted successfully', {
      userId,
      todoId
    })

    return item
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function generateSignedUrl(attachmentId: string): Promise<string> {
  try {
    logger.info('Generating Signed URL')
    const uploadUrl = await getAttachmentUrl(attachmentId)
    logger.info('Signed URL generated')

    return uploadUrl
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
): Promise<void> {
  try {

    const attachmentUrl = getAttachmentUrl(attachmentId)
    await todoAccess.updateTodoItemAttachment(userId, todoId, attachmentUrl)

    logger.info(
      'AttachmentURL updated successfully',{
        userId,
        todoId
      }
    )
    return
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

const createTodoSchema = Joi.object({
  name: Joi.string().required(),
  dueDate: Joi.string().required()
})

const updateTodoSchema = Joi.object({
  name: Joi.string().required(),
  dueDate: Joi.string().required(),
  done: Joi.boolean().required()
})
