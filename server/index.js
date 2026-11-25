const app = require("./app");
const database = require("./config/database");

const PORT = process.env.PORT || 4000;

database.connect();

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.
