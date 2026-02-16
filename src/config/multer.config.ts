import { extname } from 'path';

import { diskStorage } from 'multer';

export const multerConfig = {
  storage: diskStorage({
    destination: '/tmp',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(
        null,
        `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
      );
    },
  }),
  limits: { files: 28, fileSize: 400 * 1024 * 1024 },
};
