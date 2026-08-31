import { Language } from '../types';

export interface Translations {
  appName: string;
  appTagline: string;
  nav: {
    overview: string;
    funds: string;
    projects: string;
    expenditures: string;
    complaints: string;
    questions: string;
    documents: string;
    announcements: string;
    authorityDashboard: string;
    adminConsole: string;
  };
  roles: {
    villager: string;
    authority: string;
    admin: string;
  };
  header: {
    trackItem: string;
    notifications: string;
    signIn: string;
    signOut: string;
    setupDatabase: string;
    connected: string;
    notConnected: string;
    language: string;
    ward: string;
  };
  common: {
    search: string;
    filter: string;
    all: string;
    save: string;
    cancel: string;
    submit: string;
    loading: string;
    status: string;
    date: string;
    amount: string;
    category: string;
    action: string;
    viewDetails: string;
    download: string;
    referenceNo: string;
    noData: string;
    success: string;
    error: string;
    optional: string;
    required: string;
    rupees: string;
  };
  stats: {
    totalFunds: string;
    receivedFunds: string;
    totalExpenditure: string;
    balanceAvailable: string;
    activeProjects: string;
    resolvedGrievances: string;
    registeredVillagers: string;
    sanctioned: string;
    spent: string;
  };
  complaints: {
    submitTitle: string;
    submitDesc: string;
    titleLabel: string;
    categoryLabel: string;
    wardLabel: string;
    locationLabel: string;
    descriptionLabel: string;
    uploadPhoto: string;
    myComplaints: string;
    trackComplaint: string;
    resolutionNotes: string;
    resolvedAt: string;
  };
  questions: {
    askTitle: string;
    askDesc: string;
    subjectLabel: string;
    questionLabel: string;
    answeredQuestions: string;
    myQuestions: string;
    sarpanchResponse: string;
  };
  funds: {
    title: string;
    schemeName: string;
    fundingSource: string;
    financialYear: string;
    sanctionedAmount: string;
    receivedAmount: string;
    purpose: string;
  };
  projects: {
    title: string;
    progress: string;
    estimatedCost: string;
    amountSpent: string;
    contractor: string;
    startDate: string;
    targetDate: string;
  };
  expenditures: {
    title: string;
    ledgerDesc: string;
    billNo: string;
    vendor: string;
    paymentMode: string;
    verifiedReceipt: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Gram Setu',
    appTagline: 'Gram Panchayat Digital Governance & Transparency Platform',
    nav: {
      overview: 'Village Overview',
      funds: 'Funds & Schemes',
      projects: 'Development Projects',
      expenditures: 'Expenditure Ledger',
      complaints: 'Grievance Redressal',
      questions: 'Citizen Questions',
      documents: 'Official Records',
      announcements: 'Public Notices',
      authorityDashboard: 'Panchayat Desk',
      adminConsole: 'Admin Console',
    },
    roles: {
      villager: 'Citizen / Villager',
      authority: 'Panchayat Authority',
      admin: 'System Administrator',
    },
    header: {
      trackItem: 'Track Status',
      notifications: 'Notifications',
      signIn: 'Citizen / Official Login',
      signOut: 'Sign Out',
      setupDatabase: 'Supabase Setup',
      connected: 'Live Supabase Connected',
      notConnected: 'Connect Supabase',
      language: 'Language',
      ward: 'Ward',
    },
    common: {
      search: 'Search records...',
      filter: 'Filter by category',
      all: 'All Categories',
      save: 'Save Changes',
      cancel: 'Cancel',
      submit: 'Submit Now',
      loading: 'Loading data...',
      status: 'Status',
      date: 'Date',
      amount: 'Amount',
      category: 'Category',
      action: 'Action',
      viewDetails: 'View Details',
      download: 'Download',
      referenceNo: 'Reference No.',
      noData: 'No records found in database.',
      success: 'Operation completed successfully!',
      error: 'An error occurred. Please try again.',
      optional: 'Optional',
      required: 'Required',
      rupees: '₹',
    },
    stats: {
      totalFunds: 'Total Sanctioned Funds',
      receivedFunds: 'Grants Received in Treasury',
      totalExpenditure: 'Verified Public Expenditure',
      balanceAvailable: 'Treasury Balance Available',
      activeProjects: 'Ongoing Development Works',
      resolvedGrievances: 'Citizen Complaints Resolved',
      registeredVillagers: 'Panchayat Population',
      sanctioned: 'Sanctioned',
      spent: 'Spent',
    },
    complaints: {
      submitTitle: 'Submit a Public Grievance / Complaint',
      submitDesc: 'Report issues regarding drinking water, street lights, sanitation, drainage, or road damage directly to Panchayat officials.',
      titleLabel: 'Issue Summary / Title',
      categoryLabel: 'Problem Category',
      wardLabel: 'Ward Number',
      locationLabel: 'Exact Street / Landmark Location',
      descriptionLabel: 'Detailed Description of Problem',
      uploadPhoto: 'Upload Photo / Supporting Proof',
      myComplaints: 'My Submitted Grievances',
      trackComplaint: 'Track Complaint Reference',
      resolutionNotes: 'Official Action & Remarks',
      resolvedAt: 'Resolved Date',
    },
    questions: {
      askTitle: 'Ask a Question (Praja Prashna)',
      askDesc: 'Submit direct governance, scheme eligibility, or budget questions to the Sarpanch and Panchayat Secretary.',
      subjectLabel: 'Question Subject',
      questionLabel: 'Your Question Details',
      answeredQuestions: 'Public Q&A Forum',
      myQuestions: 'My Questions',
      sarpanchResponse: 'Panchayat Official Response',
    },
    funds: {
      title: 'Public Funds & Central/State Government Schemes',
      schemeName: 'Scheme / Grant Name',
      fundingSource: 'Funding Body / Department',
      financialYear: 'Financial Year',
      sanctionedAmount: 'Sanctioned Amount',
      receivedAmount: 'Amount Received',
      purpose: 'Sanction Purpose & Scope',
    },
    projects: {
      title: 'Village Infrastructure & Development Works',
      progress: 'Work Completion Progress',
      estimatedCost: 'Sanctioned Cost',
      amountSpent: 'Amount Disbursed to Date',
      contractor: 'Implementing Agency / Contractor',
      startDate: 'Commencement Date',
      targetDate: 'Target Completion Date',
    },
    expenditures: {
      title: 'Public Expenditure Ledger (Every Rupee Accounted)',
      ledgerDesc: 'Itemized, transparent record of all payments, materials, labor, and maintenance expenses approved by the Gram Panchayat.',
      billNo: 'Voucher / Bill No.',
      vendor: 'Vendor / Beneficiary',
      paymentMode: 'Payment Method',
      verifiedReceipt: 'Scanned Bill / Receipt',
    },
  },
  te: {
    appName: 'గ్రామ సేతు',
    appTagline: 'గ్రామ పంచాయతీ డిజిటల్ పాలన & పారదర్శక పౌర వేదిక',
    nav: {
      overview: 'గ్రామ వివరాలు',
      funds: 'నిధులు & పథకాలు',
      projects: 'అభివృద్ధి పనులు',
      expenditures: 'ఖర్చుల పద్దు',
      complaints: 'ఫిర్యాదుల విభాగం',
      questions: 'ప్రజా ప్రశ్నలు',
      documents: 'గ్రామ రికార్డులు',
      announcements: 'ప్రకటనలు',
      authorityDashboard: 'పంచాయతీ డెస్క్',
      adminConsole: 'అడ్మిన్ డెస్క్',
    },
    roles: {
      villager: 'గ్రామస్తులు / పౌరులు',
      authority: 'పంచాయతీ అధికారులు',
      admin: 'సిస్టమ్ అడ్మినిస్ట్రేటర్',
    },
    header: {
      trackItem: 'స్థితిని తెలుసుకోండి',
      notifications: 'నోటీసులు',
      signIn: 'లాగిన్ చేయండి',
      signOut: 'లాగ్ అవుట్',
      setupDatabase: 'డేటాబేస్ సెటప్',
      connected: 'డేటాబేస్ అనుసంధానమైంది',
      notConnected: 'డేటాబేస్ కలపండి',
      language: 'భాష',
      ward: 'వార్డు',
    },
    common: {
      search: 'వెతకండి...',
      filter: 'వర్గం ప్రకారం ఫిల్టర్',
      all: 'అన్ని విభాగాలు',
      save: 'భద్రపరచండి',
      cancel: 'రద్దు చేయండి',
      submit: 'సమర్పించండి',
      loading: 'డేటా లోడ్ అవుతోంది...',
      status: 'స్థితి',
      date: 'తేదీ',
      amount: 'మొత్తం',
      category: 'విభాగం',
      action: 'చర్య',
      viewDetails: 'వివరాలు చూడండి',
      download: 'డౌన్‌లోడ్',
      referenceNo: 'రిఫరెన్స్ నంబర్',
      noData: 'డేటాబేస్ లో ఎటువంటి రికార్డులు లేవు.',
      success: 'విజయవంతంగా పూర్తయింది!',
      error: 'లోపం సంభవించింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      optional: 'ఐచ్ఛికం',
      required: 'తప్పనిసరి',
      rupees: '₹',
    },
    stats: {
      totalFunds: 'మంజూరైన మొత్తం నిధులు',
      receivedFunds: 'ఖజానాకు చేరిన గ్రాంట్లు',
      totalExpenditure: 'ధృవీకరించిన ప్రజా వ్యయం',
      balanceAvailable: 'పంచాయతీ నిల్వ నిధులు',
      activeProjects: 'పురోగతిలో ఉన్న అభివృద్ధి పనులు',
      resolvedGrievances: 'పరిష్కరించబడిన ప్రజా ఫిర్యాదులు',
      registeredVillagers: 'గ్రామ జనాభా',
      sanctioned: 'మంజూరు',
      spent: 'ఖర్చు',
    },
    complaints: {
      submitTitle: 'గ్రామ పంచాయతీకి ఫిర్యాదు సమర్పించండి',
      submitDesc: 'రక్షిత మంచినీరు, వీధి దీపాలు, పారిశుధ్యం, మురుగు కాలువలు లేదా రోడ్ల మరమ్మతుల సమస్యలను అధికారులకు నేరుగా తెలియజేయండి.',
      titleLabel: 'సమస్య శీర్షిక',
      categoryLabel: 'సమస్య విభాగం',
      wardLabel: 'వార్డు నంబర్',
      locationLabel: 'వీధి / ప్రాంతం వివరాలు',
      descriptionLabel: 'సమస్య సమగ్ర వివరణ',
      uploadPhoto: 'ఫోటో / ఆధారాలు అప్‌లోడ్ చేయండి',
      myComplaints: 'నా ఫిర్యాదులు',
      trackComplaint: 'ఫిర్యాదు నంబర్ ద్వారా ట్రాక్ చేయండి',
      resolutionNotes: 'అధికారుల పరిష్కార వివరాలు',
      resolvedAt: 'పరిష్కరించిన తేదీ',
    },
    questions: {
      askTitle: 'ప్రజా ప్రశ్న సమర్పించండి',
      askDesc: 'గ్రామ పాలన, ప్రభుత్వ పథకాల లబ్ధిదారులు, బడ్జెట్ వివరాలపై సర్పంచ్ మరియు పంచాయతీ కార్యదర్శిని నేరుగా అడగండి.',
      subjectLabel: 'ప్రశ్న అంశం',
      questionLabel: 'మీ ప్రశ్న పూర్తి వివరాలు',
      answeredQuestions: 'సమాధానమిచ్చిన ప్రజా ప్రశ్నలు',
      myQuestions: 'నా ప్రశ్నలు',
      sarpanchResponse: 'పంచాయతీ అధికారిక సమాధానం',
    },
    funds: {
      title: 'ప్రభుత్వ నిధులు & కేంద్ర/రాష్ట్ర గ్రాంట్ల పారదర్శక వివరాలు',
      schemeName: 'పథకం / గ్రాంట్ పేరు',
      fundingSource: 'నిధులు సమకూర్చిన విభాగం',
      financialYear: 'ఆర్థిక సంవత్సరం',
      sanctionedAmount: 'మంజూరైన మొత్తం',
      receivedAmount: 'చేరిన మొత్తం',
      purpose: 'నిధుల వినియోగ లక్ష్యం',
    },
    projects: {
      title: 'గ్రామ మౌలిక సదుపాయాలు & అభివృద్ధి పనులు',
      progress: 'పని పూర్తి శాతం',
      estimatedCost: 'మంజూరైన ఖర్చు అంచనా',
      amountSpent: 'ఇప్పటివరకు ఖర్చు చేసిన మొత్తం',
      contractor: 'నిర్వహణ ఏజెన్సీ / కాంట్రాక్టర్',
      startDate: 'ప్రారంభ తేదీ',
      targetDate: 'పూర్తయ్యే గడువు',
    },
    expenditures: {
      title: 'గ్రామ పంచాయతీ ఖర్చుల లెక్కల పద్దు',
      ledgerDesc: 'గ్రామ పంచాయతీ ఆమోదించిన ప్రతి రూపాయి ఖర్చు, సామగ్రి కొనుగోలు, కూలీల చెల్లింపుల స్పష్టమైన పద్దు.',
      billNo: 'రసీదు / వోచర్ నంబర్',
      vendor: 'వ్యాపారి / లబ్ధిదారుడు',
      paymentMode: 'చెల్లింపు విధానం',
      verifiedReceipt: 'స్కాన్ చేసిన బిల్లు',
    },
  },
};
