process.env.NODE_ENV = "test";
process.env.DEMO_MODE = "true";
delete process.env.DATABASE_URL;
delete process.env.DATABASE_URL_UNPOOLED;