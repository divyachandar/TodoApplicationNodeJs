const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertDbObject = (objectItem) => {
  return {
    todoId: objectItem(id),
    todo: objectItem(todo),
    priority: objectItem(priority),
    status: objectItem(status),
  };
};

//Returns a list of all the players in the player table
// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and status='${status}';`;
      break;
    default:
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

// API 2
//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `select * from todo where id=${todoId};`;
  const getTodoIdQueryResponse = await db.get(getTodoIdQuery);
  response.send(getTodoIdQueryResponse);
});

// Create a todo in the todo table,
//API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `insert into todo(id,todo,priority,status)
    values (${id},'${todo}','${priority}','${status}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4
//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const getUpdateTodoQuery = `select * from todo where id=${todoId};`;
  const getUpdateTodo = await db.get(getUpdateTodoQuery);
  const {
    todo = getUpdateTodo.todo,
    status = getUpdateTodo.status,
    priority = getUpdateTodo.priority,
  } = request.body;

  const updateTodoQuery = `update todo set todo='${todo}',
    priority='${priority}',status='${status}' where id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 5
//Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
