# RWA Admin Service

The Admin Service for Real World Assets (RWA) platform. This service provides administrative functionalities including analytics, auditing, and user management.

## Features

- **Analytics**: Track and analyze platform metrics
- **Audit Logs**: Monitor and track system activities
- **Dashboard**: Comprehensive view of platform statistics
- **User Management**: Manage platform users and their permissions

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd rwa-admin
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your configuration.

## Running the Application

```bash
# Development
npm run dev

# Production mode
npm run build
npm run start

# Debug mode
npm run debug
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api
```

## Project Structure

```
src/
├── analytics/        # Analytics module
├── audit/           # Audit logging module
├── config/          # Configuration files
├── dashboard/       # Dashboard module
├── users/           # User management module
├── app.module.ts    # Main application module
└── main.ts          # Application entry point
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## Features

### Analytics Module

- Platform usage metrics
- User activity tracking
- Performance monitoring

### Audit Module

- System activity logs
- User action tracking
- Security event monitoring

### Dashboard Module

- Real-time statistics
- Data visualization
- Performance metrics

### User Management

- User CRUD operations
- Role management
- Permission control

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is private and proprietary.
