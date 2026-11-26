import 'dotenv/config';
// import { AppConfig, loadConfig, InvalidConfigError } from './bootstrap.ts';
import app from './Kernel/ExpressApp.ts';

const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0");


