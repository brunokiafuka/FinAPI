const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();

/**
 * cpf - string
 * id - uuid /string
 * name - string
 * statement - { amount, description, createdAt, type }[]
 */
const customers = [];

// Middlewares
app.use(express.json());
function verifyIfAccountCPFExists(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) return res.status(404).json({ error: "customer not found" });

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    return statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        }

        return acc - operation.amount;
    }, 0);
}

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(
        (customers) => customers.cpf === cpf
    );

    if (customerAlreadyExists)
        return res.status(400).json({ error: "Customer already exists " });

    customers.push({
        name,
        cpf,
        id: uuidV4(),
        statement: [],
    });

    return res.status(201).send();
});

app.patch("/account", verifyIfAccountCPFExists, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).send();
});

app.get("/account", verifyIfAccountCPFExists, (req, res) => {
    const { customer } = req;

    return res.status(201).json(customer);
});

app.delete("/account", verifyIfAccountCPFExists, (req, res) => {
    const { customer } = req;

    const indexToRemove = customers.findIndex(
        item => item.cpf === customer.cpf);

    if (indexToRemove === -1) {
        return response.status(404).json({ error: 'customer not found' });
    }

    costumers.splice(indexToRemove, 1);

    return res.status(200).json(customers);
});

app.get("/statement", verifyIfAccountCPFExists, (req, res) => {
    const {
        customer: { statement },
    } = req;

    res.json(statement);
});

app.get("/statement/date", verifyIfAccountCPFExists, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const formattedDate = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) =>
            statement.createdAt.toDateString() ===
            new Date(formattedDate).toDateString()
    );

    res.json(statement);
});

app.post("/deposit", verifyIfAccountCPFExists, (req, res) => {
    const { amount, description } = req.body;
    const { customer } = req;

    const statementOperations = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit",
    };

    customer.statement.push(statementOperations);

    res.status(201).send();
});

app.post("/withdraw", verifyIfAccountCPFExists, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const currentBalance = getBalance(customer.statement);

    if (currentBalance < amount)
        return res.status(400).json({ error: "insufficient funds" });

    const statementOperations = {
        amount,
        createdAt: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperations);

    res.status(201).send();
});

app.get("/balance", verifyIfAccountCPFExists, (req, res) => {
    const { customer } = req;
    const balance = getBalance(customer.statement);

    res.status(200).send({ balance });
});

app.listen(3333);
