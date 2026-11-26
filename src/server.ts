import 'dotenv/config';
import app from './Kernel/ExpressApp.ts';

const port = Number(process.env.PORT ?? 3000);

const localServer = app.listen(port, "0.0.0.0");

export default localServer


