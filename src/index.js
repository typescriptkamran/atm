#! /usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
// Initialize an array to store customer data
let customers = [];
// Global variable to store the current customer (if authenticated)
let currentCustomer = undefined;
// Function to generate a random debit card number
const generateRandomDebitCardNumber = () => {
    const cardNumber = '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
    return cardNumber;
};
// Function to open a new account
const openAccount = async () => {
    console.log(chalk.green('Welcome to the ATM!'));
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter your name:',
            validate: (input) => {
                // Check if the name already exists in customers
                const existingCustomer = customers.find((c) => c.name === input);
                if (existingCustomer) {
                    return 'A customer with this name already exists. Please choose another name.';
                }
                return true;
            },
        },
        {
            type: 'input',
            name: 'initialDeposit',
            message: 'Enter your initial deposit amount:',
        },
        {
            type: 'password',
            name: 'pin',
            message: 'Create your 4-digit PIN:',
            validate: (input) => {
                if (/^\d{4}$/.test(input)) {
                    return true;
                }
                return 'PIN must be a 4-digit number.';
            },
        },
    ]);
    const newCustomer = {
        name: answers.name,
        debitCardNumber: generateRandomDebitCardNumber(),
        pin: parseInt(answers.pin, 10),
        balance: parseFloat(answers.initialDeposit),
    };
    customers.push(newCustomer);
    saveCustomerData(customers);
    console.log(`Account created successfully for ${newCustomer.name}`);
    console.log(`Debit Card Number: ${newCustomer.debitCardNumber}`);
    console.log(`Initial Balance: $${newCustomer.balance.toFixed(2)}`);
    currentCustomer = newCustomer;
    atmMenu();
};
// Function to save customer data to a JSON file
const saveCustomerData = (data) => {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync('customerData.json', jsonData, 'utf-8');
};
// Function to retrieve customer data from a JSON file
const retrieveCustomerData = () => {
    try {
        const jsonData = fs.readFileSync('customerData.json', 'utf-8');
        return JSON.parse(jsonData);
    }
    catch (error) {
        // If the file doesn't exist or is empty, return an empty array
        return [];
    }
};
// Function to authenticate the user
const authenticateUser = async () => {
    console.log(chalk.green('Welcome to the ATM!'));
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter your name:',
        },
    ]);
    const existingCustomer = customers.find((c) => c.name === answers.name);
    if (existingCustomer) {
        const pinAnswer = await inquirer.prompt([
            {
                type: 'password',
                name: 'pin',
                message: 'Enter your 4-digit PIN:',
                validate: (input) => {
                    if (/^\d{4}$/.test(input)) {
                        return true;
                    }
                    return 'PIN must be a 4-digit number.';
                },
            },
        ]);
        if (existingCustomer.pin === parseInt(pinAnswer.pin, 10)) {
            currentCustomer = existingCustomer;
            atmMenu();
        }
        else {
            console.log(chalk.red('Authentication failed. The PIN is incorrect.'));
            console.log('Please try again.');
            main();
        }
    }
    else {
        console.log(chalk.red('Authentication failed. You are not an existing customer.'));
        console.log('Please open an account or try again.');
        main();
    }
};
// ATM functionalities
const atmMenu = async () => {
    if (currentCustomer) {
        console.log(`Welcome, ${currentCustomer.name}`);
        console.log(`Debit Card Number: ${currentCustomer.debitCardNumber}`);
        console.log(`Balance: $${currentCustomer.balance.toFixed(2)}`);
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'Select an option:',
                choices: ['Withdraw Money', 'Deposit Money', 'Check Balance', 'Exit'],
            },
        ]);
        switch (answer.choice) {
            case 'Withdraw Money':
                withdrawMoney();
                break;
            case 'Deposit Money':
                depositMoney();
                break;
            case 'Check Balance':
                console.log(`Your current balance is: $${currentCustomer.balance.toFixed(2)}`);
                atmMenu(); // Return to the main menu after checking the balance
                break;
            case 'Exit':
                console.log('Exiting ATM. Goodbye!');
                break;
        }
    }
};
// Implement withdraw and deposit functions here
const withdrawMoney = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'password',
            name: 'pin',
            message: 'Enter your 4-digit PIN for withdrawal:',
            validate: (input) => {
                if (/^\d{4}$/.test(input) && parseInt(input, 10) === currentCustomer.pin) {
                    return true;
                }
                return 'Authentication failed. The PIN is incorrect.';
            },
        },
        {
            type: 'input',
            name: 'amount',
            message: 'Enter the withdrawal amount:',
            validate: (input) => {
                const amount = parseFloat(input);
                if (isNaN(amount) || amount <= 0 || amount > currentCustomer.balance) {
                    return 'Invalid amount. Please enter a valid amount.';
                }
                return true;
            },
        },
    ]);
    const withdrawalAmount = parseFloat(answer.amount);
    currentCustomer.balance -= withdrawalAmount;
    saveCustomerData(customers);
    console.log(`Deposit successful. New balance: $${currentCustomer.balance.toFixed(2)}`);
    atmMenu();
};
const depositMoney = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'amount',
            message: 'Enter the deposit amount:',
            validate: (input) => {
                const amount = parseFloat(input);
                if (isNaN(amount) || amount <= 0) {
                    return 'Invalid amount. Please enter a valid amount.';
                }
                return true;
            },
        },
    ]);
    const depositAmount = parseFloat(answer.amount);
    currentCustomer.balance += depositAmount;
    saveCustomerData(customers);
    console.log(`Deposit successful. New balance: $${currentCustomer.balance.toFixed(2)}`);
    atmMenu();
};
// Entry point
const main = async () => {
    customers = retrieveCustomerData(); // Load customer data from the JSON file
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Welcome to the ATM! What would you like to do?',
            choices: ['Open an Account', 'Authenticate as Existing Customer', 'Exit'],
        },
    ]);
    switch (answers.action) {
        case 'Open an Account':
            openAccount();
            break;
        case 'Authenticate as Existing Customer':
            authenticateUser();
            break;
        case 'Exit':
            console.log('Exiting ATM. Goodbye!');
            break;
    }
};
export { main };
main();
