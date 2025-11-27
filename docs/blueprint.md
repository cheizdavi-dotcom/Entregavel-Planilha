# **App Name**: NeonWallet

## Core Features:

- User Authentication: Secure user login and registration with social login or email/password. Stores data in Firestore.
- Transaction Input: Allows users to input financial transactions with details like value, description, category, and type (income/expense).
- Data Persistence: Saves and retrieves user-specific transaction data to maintain persistent sessions with Firestore.
- Financial Summary Cards: Displays current balance, total income, and total expenses in prominent cards on the dashboard, reflecting real-time calculations based on stored transactions. Stored in Firestore.
- Interactive Data Visualization: Generates a donut chart for expense categorization and a bar graph for monthly trend analysis based on transaction data stored in Firestore, providing visual insights into spending habits.
- Transaction History: Presents a chronological list of user transactions on the dashboard, enabling users to review their financial activity with Firestore integration.

## Style Guidelines:

- Primary color: Neon Green (#00FF88) for income highlights and interactive elements.
- Secondary color: Neon Purple (#BC13FE) for expenses, contrasting the primary color to clearly differentiate transaction types.
- Background color: Deep dark mode (#0A0A0A) provides a stark contrast to the neon elements, enhancing visibility and aligning with the futuristic theme.
- Font: 'Inter', a modern and clean sans-serif, ensuring readability and a high-tech aesthetic for all text elements. Note: currently only Google Fonts are supported.
- Glassmorphism: Apply a frosted glass effect to cards and panels for a modern, layered look.
- Dashboard: Feature a header with user greeting and logout. Display summary cards prominently, and position graphs and the transaction list below.
- Minimal and geometric icons to complement the modern typography and overall futuristic style.