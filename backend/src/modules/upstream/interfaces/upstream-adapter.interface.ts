export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: string;
}

export interface GetEmailResult {
  email: string;
  id: number;
}

export interface GetMailResult {
  email: string;
  mailbox: string;
  count: number;
  messages: MailMessage[];
  method: string;
}

export interface IUpstreamAdapter {
  /**
   * 获取一个可用邮箱
   */
  getEmail(group?: string): Promise<GetEmailResult>;

  /**
   * 获取最新邮件（完整内容）
   */
  getMailNew(email: string, mailbox?: string): Promise<GetMailResult>;

  /**
   * 获取最新邮件纯文本（可正则匹配验证码）
   */
  getMailText(email: string, match?: string): Promise<string>;

  /**
   * 获取所有邮件
   */
  getMailAll(email: string, mailbox?: string): Promise<GetMailResult>;

  /**
   * 清空邮箱
   */
  clearMailbox(email: string, mailbox?: string): Promise<void>;

  /**
   * 列出可用邮箱
   */
  listEmails(group?: string): Promise<{ email: string; status: string; group: string | null }[]>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>;
}
