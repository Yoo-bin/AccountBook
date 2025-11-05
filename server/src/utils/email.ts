import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendInvitationEmail = async (
  toEmail: string,
  accountbookName: string,
  invitedByName: string,
  invitationToken: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const invitationLink = `${frontendUrl}/invitation/${invitationToken}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: `${invitedByName}님이 가계부 "${accountbookName}"에 초대했습니다`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>가계부 초대</h2>
        <p><strong>${invitedByName}</strong>님이 "<strong>${accountbookName}</strong>" 가계부에 초대했습니다.</p>
        <p>아래 버튼을 클릭하여 초대를 수락하세요:</p>
        <a href="${invitationLink}"
           style="display: inline-block; padding: 12px 24px; background-color: #3B82F6;
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          초대 수락하기
        </a>
        <p style="color: #666; font-size: 14px;">
          이 링크는 7일 동안 유효합니다.<br>
          링크가 작동하지 않으면 다음 URL을 복사하여 브라우저에 붙여넣으세요:<br>
          <span style="word-break: break-all;">${invitationLink}</span>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};
