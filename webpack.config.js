import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

function getCurDir() {
    return dirname(fileURLToPath(import.meta.url));
}

export default {
  entry: './src/js/app.js',
  // mode: "production",
  mode: "development",
  output: {
    filename: 'main_min.js',
    path: path.resolve(getCurDir(), 'dist'),
  },
  resolve: {
    extensions: ['', '.js']
  }
};