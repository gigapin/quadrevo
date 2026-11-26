import 'dotenv/config';
// import { AppConfig, loadConfig, InvalidConfigError } from './bootstrap.ts';
import app from './Kernel/ExpressApp.ts';

const port: number = Number(process.env.PORT);

app.listen(port ?? 3000, "0.0.0.0", () => {
    console.log(`Server is running on ${port}`);
});


