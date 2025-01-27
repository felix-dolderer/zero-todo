// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/src/domain/schema.ts
// for more complex examples, including many-to-many.

import {
  createSchema,
  definePermissions,
  ExpressionBuilder,
  Row,
  NOBODY_CAN,
  ANYONE_CAN,
  table,
  string,
  boolean,
  number,
  relationships,
} from "@rocicorp/zero"

const message = table("message")
  .columns({
    id: string(),
    senderID: string(),
    mediumID: string(),
    body: string(),
    timestamp: number(),
  })
  .primaryKey("id")

const task = table("task")
  .columns({
    id: number(),
    creatorID: string(),
    assigneeID: string(),
    title: string(),
    timestamp: number(),
    complete: boolean(),
  })
  .primaryKey("id")

const user = table("user")
  .columns({
    id: string(),
    name: string(),
    partner: boolean(),
  })
  .primaryKey("id")

const medium = table("medium")
  .columns({
    id: string(),
    name: string(),
  })
  .primaryKey("id")

const messageRelationships = relationships(message, ({ one }) => ({
  sender: one({
    sourceField: ["senderID"],
    destField: ["id"],
    destSchema: user,
  }),
  medium: one({
    sourceField: ["mediumID"],
    destField: ["id"],
    destSchema: medium,
  }),
}))

const taskRelationships = relationships(task, ({ one }) => ({
  creator: one({
    sourceField: ["creatorID"],
    destField: ["id"],
    destSchema: user,
  }),
  assignee: one({
    sourceField: ["assigneeID"],
    destField: ["id"],
    destSchema: user,
  }),
}))

export const schema = createSchema(1, {
  tables: [user, medium, message, task],
  relationships: [messageRelationships, taskRelationships],
})

export type Schema = typeof schema
export type Message = Row<typeof schema.tables.message>
export type Medium = Row<typeof schema.tables.medium>
export type User = Row<typeof schema.tables.user>
export type Task = Row<typeof schema.tables.task>

// The contents of your decoded JWT.
type AuthData = {
  sub: string | null
}

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfLoggedIn = (
    authData: AuthData,
    { cmpLit }: ExpressionBuilder<Schema, keyof Schema["tables"]>,
  ) => cmpLit(authData.sub, "IS NOT", null)

  const allowIfMessageSender = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "message">,
  ) => cmp("senderID", "=", authData.sub ?? "")

  const allowIfCreator = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "task">,
  ) => cmp("creatorID", "=", authData.sub ?? "")

  return {
    medium: {
      row: {
        insert: NOBODY_CAN,
        update: {
          preMutation: NOBODY_CAN,
        },
        delete: NOBODY_CAN,
      },
    },
    user: {
      row: {
        insert: NOBODY_CAN,
        update: {
          preMutation: NOBODY_CAN,
        },
        delete: NOBODY_CAN,
      },
    },
    message: {
      row: {
        // anyone can insert
        insert: ANYONE_CAN,
        // only sender can edit their own messages
        update: {
          preMutation: [allowIfMessageSender],
        },
        // must be logged in to delete
        delete: [allowIfLoggedIn],
      },
    },
    task: {
      row: {
        insert: [allowIfCreator],
        update: {
          preMutation: [allowIfCreator],
        },
        delete: [allowIfCreator],
      },
    },
  }
})
