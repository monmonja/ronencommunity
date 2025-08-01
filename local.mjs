/**
 * @file Run the app within the localhost for development
 */
import nodemon from 'nodemon';

nodemon({
  script: './src/backend/server.mjs', // Entry point
  ext: 'mjs',
  watch: ['./src/backend'],
  ignore: ['node_modules',],
  verbose: true,
})
  .on('start', () => {
    console.log('Starting node instance...');
  })
  .on('restart', () => {
    console.log('Detected change in server source. Restarting.');
  });
