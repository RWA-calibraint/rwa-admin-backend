import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import { BadRequestException, Logger } from '@nestjs/common';

const execPromise = promisify(exec);

async function encryptPdfWithPassword(
  inputPath: string,
  password: string,
): Promise<string> {
  const decryptedPath = path.join(
    path.dirname(inputPath),
    `decrypted-${path.basename(inputPath)}`,
  );

  const command = `qpdf --password=${password} --decrypt "${inputPath}" "${decryptedPath}"`;

  try {
    await execPromise(command);
    return decryptedPath;
  } catch (error) {
    Logger.log(error, 'PDF decrypt error');
    throw new BadRequestException({
      message: 'Incorrect pdf password',
      error: error,
    });
  }
}

export { encryptPdfWithPassword };
