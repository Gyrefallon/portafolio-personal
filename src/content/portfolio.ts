export type Language = 'es' | 'en';

// Language-neutral stack shown in the moving band under the hero.
export const stack = ['.NET', 'C#', 'Oracle PL/SQL', 'Azure', 'Databricks', 'Jenkins', 'REST APIs', 'MySQL', 'TypeScript'];

export const content = {
  es: {
    description: 'Desarrollo freelance de backend, APIs e integraciones para empresas y equipos. Experiencia con .NET, Oracle y Azure.',
    skip: 'Saltar al contenido', navLabel: 'Navegación principal', languages: 'Idioma',
    nav: ['Servicios', 'Experiencia', 'Proyecto', 'Contacto'],
    side: 'Desarrollo freelance para empresas y equipos',
    title: 'Backend e integraciones para tu negocio.',
    lead: 'Desarrollo backend e integraciones para convertir necesidades de negocio en soluciones claras y mantenibles.',
    action: 'Hablemos de tu proyecto', ctaShort: 'Hablemos', viewProject: 'Ver proyecto', heroBadge: '3+ años backend',
    servicesTitle: 'Del problema a una solución clara.',
    servicesIntro: 'Puedo colaborar con tu equipo o ayudarte a desarrollar una solución para tu negocio.',
    services: [
      ['Backend empresarial', 'Desarrollo de lógica de negocio y mantenimiento de sistemas con .NET y bases de datos relacionales.'],
      ['APIs e integraciones', 'Servicios REST y conexiones entre aplicaciones para compartir información entre sistemas.'],
      ['Modernización en Azure', 'Apoyo en iniciativas de modernización con Azure Data Factory, Databricks y servicios .NET.']
    ],
    experienceTitle: 'Experiencia aplicada.',
    experienceIntro: 'Más de tres años de experiencia backend en equipos que trabajan con sistemas empresariales.',
    roles: [
      { title: 'Socius / Sonda · AFP Capital', date: 'Abr 2024 — Sep 2026', text: 'Trabajo backend en un equipo de cuatro personas para sistemas empresariales del sector de pensiones. Participación en requerimientos, pruebas y entregas; desarrollo con VB.NET, C# y paquetes y procedimientos Oracle.' },
      { title: 'Socius / Santander Cloud', date: 'Jul 2023 — Mar 2024', text: 'Modernización en Azure con Data Factory y Databricks, desarrollo de APIs REST en .NET 6 y trabajo con Jenkins.' },
      { title: 'Socius / Actiobiz', date: 'May — Jul 2023', text: 'Desarrollo de un sistema de gestión interno con Angular 13, TypeScript, .NET Core, C# y MySQL.' }
    ],
    skillsTitle: 'Herramientas y formación',
    toolsTitle: 'Herramientas',
    educationTitle: 'Formación',
    skills: 'C# · VB.NET · .NET Framework y .NET 6 · ASP.NET · APIs REST · Oracle PL/SQL · MySQL · Azure Data Factory · Databricks · Jenkins CI/CD · Git · Jira · Angular 13 · TypeScript',
    education: 'Ingeniería en Informática, INACAP (título obtenido en 2026). Formación previa en aplicaciones web y telecomunicaciones y redes. Español nativo e inglés C1.',
    projectLabel: 'Proyecto de cliente · Identidad reservada',
    projectTitle: 'Una plataforma de fidelización y referidos.',
    projectIntro: 'Un proyecto real de cliente que reúne un portal, puntos y campañas, conectado con una plataforma de ventas.',
    projectHighlights: ['Portal de fidelización y referidos.', 'Puntos y campañas para clientes.', 'Integración con una plataforma de ventas.'],
    projectDetails: 'El nombre del cliente y el de la plataforma de ventas se mantienen en reserva hasta contar con autorización para divulgarlos. No se incluyen capturas ni resultados cuantificados.',
    contactTitle: 'Conversemos sobre lo que necesitas.',
    contactText: 'Cuéntame qué estás construyendo o en qué necesita apoyo tu equipo. También puedes escribirme por correo o conectar conmigo en LinkedIn.',
    contactEmail: 'gonzalopena.work@protonmail.com',
    form: {
      title: 'Escríbeme',
      nameLabel: 'Nombre',
      nameHint: 'Cómo quieres que te llame.',
      emailLabel: 'Correo',
      emailHint: 'Solo para responderte.',
      messageLabel: 'Mensaje',
      messageHint: 'Contexto, alcance y plazos que tienes en mente.',
      companyLabel: 'Empresa',
      submit: 'Enviar mensaje',
      sending: 'Enviando…',
      success: 'Mensaje enviado. Te responderé a la brevedad.',
      failure: 'No se pudo enviar el mensaje.',
      helperMailto: 'Al enviar se abrirá tu aplicación de correo con el mensaje preparado.',
      helperEndpoint: 'El formulario envía el mensaje directamente. También puedes escribirme por correo.',
      verificationRequired: 'Completa la verificación anti-bots antes de enviar.',
      privacy: 'Uso tus datos solo para responderte. No los almaceno ni los comparto.',
      errors: {
        name_required: 'Escribe tu nombre.',
        name_short: 'El nombre necesita al menos 2 caracteres.',
        name_long: 'El nombre no puede superar los 80 caracteres.',
        email_required: 'Escribe tu correo.',
        email_invalid: 'Revisa el correo: falta el @ o el dominio.',
        message_required: 'Escribe un mensaje.',
        message_short: 'Cuéntame un poco más: al menos 20 caracteres.',
        message_long: 'El mensaje no puede superar los 2000 caracteres.'
      }
    },
    email: 'Enviar un correo', linkedin: 'Conectar en LinkedIn', github: 'Ver GitHub', footer: 'Desarrollo freelance'
  },
  en: {
    description: 'Freelance backend development, APIs and integrations for businesses and teams. Experience with .NET, Oracle and Azure.',
    skip: 'Skip to content', navLabel: 'Main navigation', languages: 'Language',
    nav: ['Services', 'Experience', 'Project', 'Contact'],
    side: 'Freelance development for businesses and teams',
    title: 'Backend and integrations for your business.',
    lead: 'Backend development and integrations that turn business needs into clear, maintainable solutions.',
    action: 'Let’s talk about your project', ctaShort: 'Let’s talk', viewProject: 'View project', heroBadge: '3+ years backend',
    servicesTitle: 'From the problem to a clear solution.',
    servicesIntro: 'I can collaborate with your team or help develop a solution for your business.',
    services: [
      ['Enterprise backend', 'Business logic development and maintenance for systems built with .NET and relational databases.'],
      ['APIs and integrations', 'REST services and connections between applications to share information across systems.'],
      ['Azure modernization', 'Support for modernization initiatives using Azure Data Factory, Databricks and .NET services.']
    ],
    experienceTitle: 'Experience in practice.',
    experienceIntro: 'More than three years of backend experience on teams working with enterprise systems.',
    roles: [
      { title: 'Socius / Sonda · AFP Capital', date: 'Apr 2024 — Sep 2026', text: 'Backend work on a four-person team supporting enterprise systems in the pensions sector. Contributed to requirements, testing and releases, developing with VB.NET, C# and Oracle packages and procedures.' },
      { title: 'Socius / Santander Cloud', date: 'Jul 2023 — Mar 2024', text: 'Azure modernization with Data Factory and Databricks, REST API development in .NET 6 and work with Jenkins.' },
      { title: 'Socius / Actiobiz', date: 'May — Jul 2023', text: 'Development of an internal management system using Angular 13, TypeScript, .NET Core, C# and MySQL.' }
    ],
    skillsTitle: 'Tools and education',
    toolsTitle: 'Tools',
    educationTitle: 'Education',
    skills: 'C# · VB.NET · .NET Framework and .NET 6 · ASP.NET · REST APIs · Oracle PL/SQL · MySQL · Azure Data Factory · Databricks · Jenkins CI/CD · Git · Jira · Angular 13 · TypeScript',
    education: 'Informatics Engineering, INACAP (degree awarded in 2026). Previous training in web applications and telecommunications and networks. Native Spanish and C1 English.',
    projectLabel: 'Client project · Identity withheld',
    projectTitle: 'A loyalty and referral platform.',
    projectIntro: 'A real client project bringing together a portal, points and campaigns, connected to a sales platform.',
    projectHighlights: ['Loyalty and referral portal.', 'Points and campaigns for customers.', 'Integration with a sales platform.'],
    projectDetails: 'The client and sales platform names are withheld until disclosure is authorized. No screenshots or quantified results are included.',
    contactTitle: 'Let’s talk about what you need.',
    contactText: 'Tell me what you are building or where your team needs support. You can also email me or connect on LinkedIn.',
    contactEmail: 'gonzalopena.work@protonmail.com',
    form: {
      title: 'Write to me',
      nameLabel: 'Name',
      nameHint: 'How should I address you?',
      emailLabel: 'Email',
      emailHint: 'Only to reply to you.',
      messageLabel: 'Message',
      messageHint: 'Context, scope and timing you have in mind.',
      companyLabel: 'Company',
      submit: 'Send message',
      sending: 'Sending…',
      success: 'Message sent. I will reply as soon as I can.',
      failure: 'The message could not be sent.',
      helperMailto: 'Sending opens your email app with the message ready to go.',
      helperEndpoint: 'The form sends the message directly. You can also email me.',
      verificationRequired: 'Complete the anti-bot verification before sending.',
      privacy: 'I use your details only to reply. I do not store or share them.',
      errors: {
        name_required: 'Enter your name.',
        name_short: 'Your name needs at least 2 characters.',
        name_long: 'Your name cannot exceed 80 characters.',
        email_required: 'Enter your email address.',
        email_invalid: 'Check the email: it is missing the @ or the domain.',
        message_required: 'Enter a message.',
        message_short: 'Tell me a little more: at least 20 characters.',
        message_long: 'Your message cannot exceed 2000 characters.'
      }
    },
    email: 'Send an email', linkedin: 'Connect on LinkedIn', github: 'View GitHub', footer: 'Freelance development'
  }
} satisfies Record<Language, unknown>;

export type PortfolioContent = (typeof content)[Language];
