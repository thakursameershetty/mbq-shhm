const { buildNameWithTests, firstNameOf } = require('./notifyUtils');

const formatUserId = (id, createdAt) => {
  const num = parseInt(id, 10);
  if (isNaN(num)) return `MBQ${id}`;
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `MBQ${year}${String(num).padStart(3, '0')}`;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove all non-digit characters
  let digits = phone.toString().replace(/\D/g, '');
  // Default to India (+91) if a 10 digit number is provided
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
};

const sendWhatsAppTemplate = async (toPhone, templateName, parameters = []) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn(`WhatsApp credentials missing. Skipping template ${templateName} to ${toPhone}`);
    return;
  }

  const formattedPhone = formatPhoneNumber(toPhone);
  if (!formattedPhone) {
    console.warn(`Invalid phone number provided for WhatsApp template ${templateName}`);
    return;
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en'
      }
    }
  };

  if (parameters.length > 0) {
    payload.template.components = [
      {
        type: 'body',
        parameters: parameters.map(param => (
          typeof param === 'object' && param !== null
            ? param
            : { type: 'text', text: String(param) }
        ))
      }
    ];
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Error sending WhatsApp template ${templateName}:`, data);
      return;
    }
    console.log(`WhatsApp template ${templateName} sent to ${formattedPhone}`, data);
  } catch (error) {
    console.error(`Exception while sending WhatsApp template ${templateName}:`, error);
  }
};

const sendWhatsAppOtp = async (phone, otp) => {
  if (!phone) return;
  // {{1}} = otp
  await sendWhatsAppTemplate(phone, 'order_status', [otp, 'dummy2', 'dummy3', 'dummy4']);
};

// Uses the approved 'mbq_shhm_order_status' template (Meta Business Manager) -
// the shhm-branded counterpart to mbq_tutorial's 'order_status', same body but
// with named variables: name, name1 (Volunteer ID), name2 (Selected Test), name3 (Username).
const sendWhatsAppSampleDispatched = async (user) => {
  if (!user || !user.phone) return;
  await sendWhatsAppTemplate(user.phone, 'mbq_shhm_order_status', [
    { type: 'text', text: firstNameOf(user), parameter_name: 'name' },
    { type: 'text', text: formatUserId(user.id, user.created_at), parameter_name: 'name1' },
    { type: 'text', text: user.gene_type || 'MyBodyQode Full Panel', parameter_name: 'name2' },
    { type: 'text', text: user.username, parameter_name: 'name3' }
  ]);
};

const sendWhatsAppReportGenerated = async (user, testName) => {
  if (!user || !user.phone) return;
  await sendWhatsAppTemplate(user.phone, 'mbq_report_generated', [
    { type: 'text', text: buildNameWithTests(firstNameOf(user), testName), parameter_name: 'name' }
  ]);
};

const sendWhatsAppReportReady = async (user, testName) => {
  if (!user || !user.phone) return;
  await sendWhatsAppTemplate(user.phone, 'mbq_shhm_report_ready', [
    { type: 'text', text: buildNameWithTests(firstNameOf(user), testName), parameter_name: 'name' }
  ]);
};

const sendWhatsAppSurveyRequested = async (user, testNames) => {
  if (!user || !user.phone) return;
  await sendWhatsAppTemplate(user.phone, 'mbq_shhm_survey_requested', [
    { type: 'text', text: buildNameWithTests(firstNameOf(user), testNames), parameter_name: 'name' }
  ]);
};

module.exports = {
  sendWhatsAppOtp,
  sendWhatsAppSampleDispatched,
  sendWhatsAppReportGenerated,
  sendWhatsAppReportReady,
  sendWhatsAppSurveyRequested
};
