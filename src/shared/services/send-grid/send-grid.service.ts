import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as SendGrid from '@sendgrid/mail';
import * as fs from 'fs-extra';
import Handlebars from 'handlebars';

@Injectable()
export class SendGridServices {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get('SEND_GRID_API_KEY'));
  }

  async send(
    mail: SendGrid.MailDataRequired,
  ): Promise<[SendGrid.ClientResponse, object]> {
    return SendGrid.send(mail);
  }

  async sendMail(
    recipient: string,
    subject: string,
    templateName: string,
    context: any,
  ) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/shared/services/send-grid/mail-templates',
        `${templateName}.hbs`,
      );
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = Handlebars.compile(templateSource);
      const html = compiledTemplate(context);

      const result = {
        to: recipient,
        from: this.configService.get('SEND_GRID_FROM_EMAIL'),
        subject,
        html,
      };
      await this.send(result);
      return result;
    } catch (error) {
      Logger.error('Error sending email:', error);
    }
  }

  prepareMailTemplate(
    mailBody: string,
    recipient: string,
    subject: string,
  ): SendGrid.MailDataRequired {
    const sentences = mailBody.split('. ');
    const body = sentences.map((sentence) => `<p>${sentence}</p>`).join('');
    return {
      html: body,
      to: recipient,
      subject,
      from: this.configService.get('SEND_GRID_FROM_EMAIL'),
    };
  }
}
