/**
 * Skill Normalizer Utility
 * Industry-standard skill matching for ATS systems
 * Supports: Tech, Finance, Healthcare, Marketing, Sales, Engineering, Operations, and more
 */

// Common skill aliases and variations
export const SKILL_ALIASES: Record<string, string> = {
    // ========== PROGRAMMING LANGUAGES ==========
    // JavaScript ecosystem
    js: "javascript",
    es6: "javascript",
    es2015: "javascript",
    ecmascript: "javascript",
    node: "nodejs",
    "node.js": "nodejs",
    express: "expressjs",
    "express.js": "expressjs",
    react: "reactjs",
    "react.js": "reactjs",
    vue: "vuejs",
    "vue.js": "vuejs",
    next: "nextjs",
    "next.js": "nextjs",
    nuxt: "nuxtjs",
    "nuxt.js": "nuxtjs",
    ts: "typescript",
    angular: "angular",
    angularjs: "angular",
    svelte: "svelte",
    gatsby: "gatsby",
    remix: "remix",
    astro: "astro",

    // Python ecosystem
    py: "python",
    python3: "python",
    python2: "python",
    django: "django",
    flask: "flask",
    fastapi: "fastapi",
    pandas: "pandas",
    numpy: "numpy",
    sklearn: "scikit-learn",
    "scikit learn": "scikit-learn",
    scipy: "scipy",
    matplotlib: "matplotlib",
    seaborn: "seaborn",
    jupyter: "jupyter",
    ipython: "jupyter",
    pyspark: "pyspark",

    // Other languages
    "c++": "cpp",
    cplusplus: "cpp",
    "c#": "csharp",
    "c sharp": "csharp",
    ".net": "dotnet",
    dotnet: "dotnet",
    "asp.net": "aspnet",
    "asp net": "aspnet",
    ".net core": "dotnet-core",
    go: "golang",
    golang: "golang",
    rust: "rust",
    java: "java",
    spring: "spring-framework",
    "spring boot": "spring-boot",
    springboot: "spring-boot",
    hibernate: "hibernate",
    ruby: "ruby",
    ror: "ruby-on-rails",
    rails: "ruby-on-rails",
    "ruby on rails": "ruby-on-rails",
    php: "php",
    laravel: "laravel",
    symfony: "symfony",
    wordpress: "wordpress",
    drupal: "drupal",
    scala: "scala",
    akka: "akka",
    r: "r-language",
    "r programming": "r-language",
    matlab: "matlab",
    perl: "perl",
    haskell: "haskell",
    erlang: "erlang",
    elixir: "elixir",
    phoenix: "phoenix-framework",
    clojure: "clojure",
    lua: "lua",
    fortran: "fortran",
    cobol: "cobol",
    vba: "vba",
    "visual basic": "visual-basic",
    powershell: "powershell",
    bash: "bash",
    shell: "shell-scripting",
    zsh: "shell-scripting",

    // ========== DATABASES ==========
    postgres: "postgresql",
    psql: "postgresql",
    pg: "postgresql",
    mongo: "mongodb",
    mysql: "mysql",
    mariadb: "mariadb",
    mssql: "sql-server",
    "sql server": "sql-server",
    "microsoft sql server": "sql-server",
    oracle: "oracle-database",
    "oracle db": "oracle-database",
    oracledb: "oracle-database",
    redis: "redis",
    memcached: "memcached",
    dynamodb: "aws-dynamodb",
    dynamo: "aws-dynamodb",
    cassandra: "cassandra",
    couchdb: "couchdb",
    couchbase: "couchbase",
    neo4j: "neo4j",
    "graph database": "graph-databases",
    elasticsearch: "elasticsearch",
    elastic: "elasticsearch",
    es: "elasticsearch",
    opensearch: "opensearch",
    solr: "solr",
    sqlite: "sqlite",
    cockroachdb: "cockroachdb",
    timescale: "timescaledb",
    influxdb: "influxdb",
    snowflake: "snowflake",
    redshift: "aws-redshift",
    bigquery: "google-bigquery",
    "big query": "google-bigquery",

    // ========== CLOUD PLATFORMS ==========
    aws: "amazon-web-services",
    "amazon web services": "amazon-web-services",
    ec2: "aws-ec2",
    s3: "aws-s3",
    lambda: "aws-lambda",
    sqs: "aws-sqs",
    sns: "aws-sns",
    rds: "aws-rds",
    ecs: "aws-ecs",
    eks: "aws-eks",
    fargate: "aws-fargate",
    cloudformation: "aws-cloudformation",
    cdk: "aws-cdk",
    gcp: "google-cloud-platform",
    "google cloud": "google-cloud-platform",
    gke: "google-kubernetes-engine",
    "cloud functions": "google-cloud-functions",
    "cloud run": "google-cloud-run",
    azure: "microsoft-azure",
    "microsoft azure": "microsoft-azure",
    "azure devops": "azure-devops",
    "azure functions": "azure-functions",
    aks: "azure-kubernetes-service",
    digitalocean: "digitalocean",
    heroku: "heroku",
    vercel: "vercel",
    netlify: "netlify",
    cloudflare: "cloudflare",
    linode: "linode",

    // ========== DEVOPS & INFRASTRUCTURE ==========
    k8s: "kubernetes",
    kube: "kubernetes",
    docker: "docker",
    podman: "podman",
    containerd: "containerd",
    "ci/cd": "cicd",
    "ci cd": "cicd",
    "continuous integration": "cicd",
    "continuous delivery": "cicd",
    "continuous deployment": "cicd",
    jenkins: "jenkins",
    "github actions": "github-actions",
    "gh actions": "github-actions",
    "gitlab ci": "gitlab-ci",
    "gitlab-ci": "gitlab-ci",
    "circle ci": "circleci",
    circleci: "circleci",
    "travis ci": "travis-ci",
    travisci: "travis-ci",
    bamboo: "bamboo",
    teamcity: "teamcity",
    "argo cd": "argocd",
    argocd: "argocd",
    terraform: "terraform",
    pulumi: "pulumi",
    ansible: "ansible",
    puppet: "puppet",
    chef: "chef",
    saltstack: "saltstack",
    packer: "packer",
    vagrant: "vagrant",
    helm: "helm",
    kustomize: "kustomize",
    istio: "istio",
    envoy: "envoy",
    linkerd: "linkerd",
    prometheus: "prometheus",
    grafana: "grafana",
    datadog: "datadog",
    "new relic": "new-relic",
    newrelic: "new-relic",
    splunk: "splunk",
    elk: "elk-stack",
    "elk stack": "elk-stack",
    kibana: "kibana",
    logstash: "logstash",
    fluentd: "fluentd",
    nginx: "nginx",
    apache: "apache-httpd",
    haproxy: "haproxy",
    traefik: "traefik",
    consul: "consul",
    vault: "hashicorp-vault",
    nomad: "nomad",

    // ========== AI/ML ==========
    ml: "machine-learning",
    "machine learning": "machine-learning",
    ai: "artificial-intelligence",
    "artificial intelligence": "artificial-intelligence",
    "deep learning": "deep-learning",
    dl: "deep-learning",
    nlp: "natural-language-processing",
    "natural language processing": "natural-language-processing",
    "computer vision": "computer-vision",
    cv: "computer-vision",
    "image recognition": "computer-vision",
    tensorflow: "tensorflow",
    tf: "tensorflow",
    pytorch: "pytorch",
    torch: "pytorch",
    keras: "keras",
    langchain: "langchain",
    llamaindex: "llamaindex",
    llm: "large-language-models",
    "large language models": "large-language-models",
    gpt: "large-language-models",
    chatgpt: "large-language-models",
    openai: "openai-api",
    claude: "anthropic-api",
    anthropic: "anthropic-api",
    huggingface: "huggingface",
    "hugging face": "huggingface",
    transformers: "transformers",
    bert: "bert",
    rag: "retrieval-augmented-generation",
    "retrieval augmented generation": "retrieval-augmented-generation",
    "neural networks": "neural-networks",
    cnn: "convolutional-neural-networks",
    rnn: "recurrent-neural-networks",
    lstm: "lstm",
    gan: "generative-adversarial-networks",
    "reinforcement learning": "reinforcement-learning",
    rl: "reinforcement-learning",
    "recommendation systems": "recommendation-systems",
    mlops: "mlops",
    "ml ops": "mlops",
    "feature engineering": "feature-engineering",
    "model training": "model-training",
    "model deployment": "model-deployment",
    sagemaker: "aws-sagemaker",
    "vertex ai": "google-vertex-ai",
    "azure ml": "azure-machine-learning",
    databricks: "databricks",

    // ========== MOBILE DEVELOPMENT ==========
    ios: "ios-development",
    "ios development": "ios-development",
    iphone: "ios-development",
    ipad: "ios-development",
    android: "android-development",
    "android development": "android-development",
    "react native": "react-native",
    rn: "react-native",
    flutter: "flutter",
    dart: "dart",
    swift: "swift",
    swiftui: "swiftui",
    kotlin: "kotlin",
    "objective-c": "objective-c",
    objc: "objective-c",
    xamarin: "xamarin",
    ionic: "ionic",
    capacitor: "capacitor",
    cordova: "cordova",
    phonegap: "cordova",
    expo: "expo",

    // ========== FRONTEND ==========
    html: "html",
    html5: "html",
    css: "css",
    css3: "css",
    sass: "sass",
    scss: "sass",
    less: "less",
    stylus: "stylus",
    tailwind: "tailwindcss",
    "tailwind css": "tailwindcss",
    bootstrap: "bootstrap",
    "material ui": "material-ui",
    mui: "material-ui",
    chakra: "chakra-ui",
    "chakra ui": "chakra-ui",
    "ant design": "ant-design",
    antd: "ant-design",
    "styled components": "styled-components",
    emotion: "emotion",
    "css modules": "css-modules",
    webpack: "webpack",
    vite: "vite",
    rollup: "rollup",
    parcel: "parcel",
    esbuild: "esbuild",
    turbopack: "turbopack",
    babel: "babel",
    swc: "swc",
    storybook: "storybook",
    figma: "figma",
    sketch: "sketch",
    "adobe xd": "adobe-xd",
    zeplin: "zeplin",
    "responsive design": "responsive-design",
    "mobile first": "mobile-first-design",
    accessibility: "web-accessibility",
    a11y: "web-accessibility",
    wcag: "web-accessibility",
    seo: "seo",
    "search engine optimization": "seo",
    pwa: "progressive-web-apps",
    "progressive web app": "progressive-web-apps",

    // ========== TESTING ==========
    jest: "jest",
    mocha: "mocha",
    chai: "chai",
    jasmine: "jasmine",
    karma: "karma",
    cypress: "cypress",
    selenium: "selenium",
    webdriver: "selenium",
    playwright: "playwright",
    puppeteer: "puppeteer",
    testcafe: "testcafe",
    pytest: "pytest",
    unittest: "python-unittest",
    junit: "junit",
    testng: "testng",
    rspec: "rspec",
    minitest: "minitest",
    phpunit: "phpunit",
    tdd: "test-driven-development",
    bdd: "behavior-driven-development",
    "unit testing": "unit-testing",
    "integration testing": "integration-testing",
    "e2e testing": "e2e-testing",
    "end to end testing": "e2e-testing",
    "load testing": "load-testing",
    "performance testing": "performance-testing",
    jmeter: "jmeter",
    k6: "k6",
    locust: "locust",
    gatling: "gatling",
    "code coverage": "code-coverage",
    sonarqube: "sonarqube",
    sonar: "sonarqube",

    // ========== API & ARCHITECTURE ==========
    rest: "rest-api",
    restful: "rest-api",
    "rest api": "rest-api",
    graphql: "graphql",
    apollo: "apollo-graphql",
    grpc: "grpc",
    protobuf: "protobuf",
    websocket: "websockets",
    websockets: "websockets",
    "socket.io": "socketio",
    "socket io": "socketio",
    microservices: "microservices",
    "micro services": "microservices",
    monolith: "monolithic-architecture",
    soa: "service-oriented-architecture",
    "event driven": "event-driven-architecture",
    eda: "event-driven-architecture",
    cqrs: "cqrs",
    "event sourcing": "event-sourcing",
    ddd: "domain-driven-design",
    "domain driven design": "domain-driven-design",
    "clean architecture": "clean-architecture",
    "hexagonal architecture": "hexagonal-architecture",
    serverless: "serverless",
    faas: "functions-as-a-service",
    "api gateway": "api-gateway",
    kong: "kong",
    apigee: "apigee",
    swagger: "swagger",
    openapi: "openapi",
    postman: "postman",
    insomnia: "insomnia",

    // ========== MESSAGE QUEUES & STREAMING ==========
    kafka: "apache-kafka",
    "apache kafka": "apache-kafka",
    rabbitmq: "rabbitmq",
    "rabbit mq": "rabbitmq",
    activemq: "activemq",
    zeromq: "zeromq",
    nats: "nats",
    pulsar: "apache-pulsar",
    kinesis: "aws-kinesis",
    pubsub: "google-pubsub",
    "pub sub": "google-pubsub",
    "event hub": "azure-event-hubs",
    eventhub: "azure-event-hubs",

    // ========== DATA ENGINEERING & ANALYTICS ==========
    sql: "sql",
    nosql: "nosql",
    etl: "etl",
    elt: "elt",
    "data engineering": "data-engineering",
    "data science": "data-science",
    "data analysis": "data-analysis",
    "data analytics": "data-analysis",
    bi: "business-intelligence",
    "business intelligence": "business-intelligence",
    tableau: "tableau",
    "power bi": "power-bi",
    powerbi: "power-bi",
    looker: "looker",
    metabase: "metabase",
    superset: "apache-superset",
    qlik: "qlik",
    "data warehouse": "data-warehouse",
    dwh: "data-warehouse",
    "data lake": "data-lake",
    "data lakehouse": "data-lakehouse",
    dbt: "dbt",
    airflow: "apache-airflow",
    "apache airflow": "apache-airflow",
    dagster: "dagster",
    prefect: "prefect",
    luigi: "luigi",
    spark: "apache-spark",
    "apache spark": "apache-spark",
    hadoop: "hadoop",
    hive: "apache-hive",
    presto: "presto",
    trino: "trino",
    flink: "apache-flink",
    beam: "apache-beam",
    fivetran: "fivetran",
    stitch: "stitch-data",
    airbyte: "airbyte",
    segment: "segment",
    "data modeling": "data-modeling",
    "dimensional modeling": "dimensional-modeling",
    "star schema": "star-schema",
    "data governance": "data-governance",
    "data quality": "data-quality",

    // ========== SECURITY ==========
    cybersecurity: "cybersecurity",
    "cyber security": "cybersecurity",
    infosec: "information-security",
    "information security": "information-security",
    appsec: "application-security",
    "application security": "application-security",
    devsecops: "devsecops",
    sast: "sast",
    dast: "dast",
    "penetration testing": "penetration-testing",
    pentest: "penetration-testing",
    "pen testing": "penetration-testing",
    "vulnerability assessment": "vulnerability-assessment",
    owasp: "owasp",
    authentication: "authentication",
    authorization: "authorization",
    oauth: "oauth",
    oauth2: "oauth2",
    oidc: "openid-connect",
    "openid connect": "openid-connect",
    jwt: "jwt",
    "json web token": "jwt",
    saml: "saml",
    sso: "single-sign-on",
    "single sign on": "single-sign-on",
    mfa: "multi-factor-authentication",
    "2fa": "two-factor-authentication",
    encryption: "encryption",
    ssl: "ssl-tls",
    tls: "ssl-tls",
    https: "ssl-tls",
    pki: "public-key-infrastructure",
    soc2: "soc2-compliance",
    "soc 2": "soc2-compliance",
    hipaa: "hipaa-compliance",
    gdpr: "gdpr-compliance",
    "pci dss": "pci-dss-compliance",
    pci: "pci-dss-compliance",
    "iso 27001": "iso-27001",
    nist: "nist-framework",
    siem: "siem",
    crowdstrike: "crowdstrike",
    sentinel: "microsoft-sentinel",

    // ========== VERSION CONTROL ==========
    git: "git",
    github: "github",
    gitlab: "gitlab",
    bitbucket: "bitbucket",
    svn: "subversion",
    subversion: "subversion",
    mercurial: "mercurial",
    gitflow: "gitflow",
    "trunk based development": "trunk-based-development",
    "code review": "code-review",
    "pull request": "pull-requests",
    pr: "pull-requests",
    "merge request": "merge-requests",
    mr: "merge-requests",

    // ========== PROJECT MANAGEMENT & AGILE ==========
    agile: "agile",
    scrum: "scrum",
    kanban: "kanban",
    lean: "lean-methodology",
    safe: "scaled-agile-framework",
    "scaled agile": "scaled-agile-framework",
    jira: "jira",
    confluence: "confluence",
    asana: "asana",
    trello: "trello",
    monday: "monday-com",
    notion: "notion",
    linear: "linear",
    clickup: "clickup",
    "project management": "project-management",
    pm: "project-management",
    "product management": "product-management",
    "product owner": "product-owner",
    po: "product-owner",
    "scrum master": "scrum-master",
    "sprint planning": "sprint-planning",
    "backlog grooming": "backlog-refinement",
    "backlog refinement": "backlog-refinement",
    retrospective: "retrospective",
    "user story": "user-stories",
    "user stories": "user-stories",
    "acceptance criteria": "acceptance-criteria",
    okr: "okrs",
    okrs: "okrs",
    kpi: "kpis",
    kpis: "kpis",

    // ========== SOFT SKILLS ==========
    leadership: "leadership",
    "team leadership": "leadership",
    "people management": "people-management",
    management: "management",
    communication: "communication",
    "written communication": "written-communication",
    "verbal communication": "verbal-communication",
    presentation: "presentation-skills",
    "public speaking": "public-speaking",
    "problem solving": "problem-solving",
    "critical thinking": "critical-thinking",
    "analytical thinking": "analytical-thinking",
    teamwork: "teamwork",
    collaboration: "collaboration",
    "cross functional": "cross-functional-collaboration",
    mentoring: "mentoring",
    coaching: "coaching",
    "stakeholder management": "stakeholder-management",
    "conflict resolution": "conflict-resolution",
    negotiation: "negotiation",
    "time management": "time-management",
    prioritization: "prioritization",
    "self motivated": "self-motivation",
    "attention to detail": "attention-to-detail",
    adaptability: "adaptability",
    creativity: "creativity",
    innovation: "innovation",
    "emotional intelligence": "emotional-intelligence",
    eq: "emotional-intelligence",

    // ========== FINANCE & ACCOUNTING ==========
    "financial analysis": "financial-analysis",
    "financial modeling": "financial-modeling",
    "fp&a": "financial-planning-analysis",
    fpna: "financial-planning-analysis",
    budgeting: "budgeting",
    forecasting: "forecasting",
    "variance analysis": "variance-analysis",
    "p&l": "profit-and-loss",
    "profit and loss": "profit-and-loss",
    "balance sheet": "balance-sheet",
    "cash flow": "cash-flow",
    gaap: "gaap",
    ifrs: "ifrs",
    audit: "auditing",
    auditing: "auditing",
    "internal audit": "internal-audit",
    "external audit": "external-audit",
    tax: "taxation",
    taxation: "taxation",
    "accounts payable": "accounts-payable",
    ap: "accounts-payable",
    "accounts receivable": "accounts-receivable",
    ar: "accounts-receivable",
    "general ledger": "general-ledger",
    gl: "general-ledger",
    quickbooks: "quickbooks",
    sap: "sap",
    "oracle financials": "oracle-financials",
    netsuite: "netsuite",
    erp: "erp",
    excel: "microsoft-excel",
    "microsoft excel": "microsoft-excel",
    "advanced excel": "advanced-excel",
    vlookup: "advanced-excel",
    "pivot tables": "pivot-tables",
    macros: "excel-macros",
    "financial reporting": "financial-reporting",
    "management reporting": "management-reporting",

    // ========== MARKETING ==========
    "digital marketing": "digital-marketing",
    "content marketing": "content-marketing",
    "inbound marketing": "inbound-marketing",
    "outbound marketing": "outbound-marketing",
    "email marketing": "email-marketing",
    "social media marketing": "social-media-marketing",
    smm: "social-media-marketing",
    sem: "sem",
    "search engine marketing": "sem",
    ppc: "pay-per-click",
    "pay per click": "pay-per-click",
    "google ads": "google-ads",
    adwords: "google-ads",
    "facebook ads": "facebook-ads",
    "meta ads": "meta-ads",
    "linkedin ads": "linkedin-ads",
    "display advertising": "display-advertising",
    programmatic: "programmatic-advertising",
    dsp: "demand-side-platform",
    "google analytics": "google-analytics",
    ga4: "google-analytics-4",
    "adobe analytics": "adobe-analytics",
    mixpanel: "mixpanel",
    amplitude: "amplitude",
    heap: "heap-analytics",
    hubspot: "hubspot",
    marketo: "marketo",
    pardot: "pardot",
    "salesforce marketing cloud": "salesforce-marketing-cloud",
    mailchimp: "mailchimp",
    klaviyo: "klaviyo",
    braze: "braze",
    "customer journey": "customer-journey",
    "marketing automation": "marketing-automation",
    crm: "crm",
    "customer relationship management": "crm",
    salesforce: "salesforce",
    "dynamics 365": "dynamics-365",
    "brand management": "brand-management",
    branding: "branding",
    copywriting: "copywriting",
    "content writing": "content-writing",
    "content strategy": "content-strategy",
    "a/b testing": "ab-testing",
    "ab testing": "ab-testing",
    cro: "conversion-rate-optimization",
    "conversion optimization": "conversion-rate-optimization",
    "growth hacking": "growth-hacking",
    "growth marketing": "growth-marketing",
    "product marketing": "product-marketing",
    gtm: "go-to-market",
    "go to market": "go-to-market",
    "market research": "market-research",
    "competitive analysis": "competitive-analysis",
    positioning: "positioning",
    messaging: "messaging-strategy",

    // ========== SALES ==========
    sales: "sales",
    "b2b sales": "b2b-sales",
    "b2c sales": "b2c-sales",
    "enterprise sales": "enterprise-sales",
    "saas sales": "saas-sales",
    "inside sales": "inside-sales",
    "field sales": "field-sales",
    "outside sales": "outside-sales",
    "account executive": "account-executive",
    ae: "account-executive",
    "account management": "account-management",
    am: "account-management",
    "customer success": "customer-success",
    cs: "customer-success",
    csm: "customer-success-manager",
    "business development": "business-development",
    bd: "business-development",
    bdr: "business-development-representative",
    sdr: "sales-development-representative",
    "lead generation": "lead-generation",
    "lead gen": "lead-generation",
    prospecting: "prospecting",
    "cold calling": "cold-calling",
    outreach: "outreach",
    "pipeline management": "pipeline-management",
    "sales pipeline": "pipeline-management",
    "quota attainment": "quota-attainment",
    "closing deals": "closing",
    closing: "closing",
    "sales negotiation": "negotiation",
    "contract negotiation": "contract-negotiation",
    rfp: "rfp-response",
    "proposal writing": "proposal-writing",
    demos: "product-demos",
    "product demos": "product-demos",
    "discovery calls": "discovery-calls",
    "solution selling": "solution-selling",
    "consultative selling": "consultative-selling",
    "value selling": "value-selling",
    meddic: "meddic",
    "spin selling": "spin-selling",
    "challenger sale": "challenger-sale",
    sandler: "sandler-selling",
    "salesforce crm": "salesforce",
    "hubspot crm": "hubspot-crm",
    "outreach.io": "outreach-io",
    salesloft: "salesloft",
    zoominfo: "zoominfo",
    "linkedin sales navigator": "linkedin-sales-navigator",
    gong: "gong-io",
    chorus: "chorus-ai",

    // ========== HEALTHCARE ==========
    healthcare: "healthcare",
    "health care": "healthcare",
    ehr: "electronic-health-records",
    "electronic health records": "electronic-health-records",
    emr: "electronic-medical-records",
    "electronic medical records": "electronic-medical-records",
    epic: "epic-systems",
    cerner: "cerner",
    meditech: "meditech",
    hl7: "hl7",
    fhir: "fhir",
    "icd-10": "icd-10",
    cpt: "cpt-codes",
    "medical coding": "medical-coding",
    "medical billing": "medical-billing",
    "revenue cycle": "revenue-cycle-management",
    rcm: "revenue-cycle-management",
    "clinical trials": "clinical-trials",
    "clinical research": "clinical-research",
    fda: "fda-regulations",
    "hipaa compliance": "hipaa-compliance",
    "healthcare analytics": "healthcare-analytics",
    "population health": "population-health",
    telehealth: "telehealth",
    telemedicine: "telemedicine",
    "patient care": "patient-care",
    nursing: "nursing",
    pharmacy: "pharmacy",
    pharmaceutical: "pharmaceutical",
    biotech: "biotechnology",
    biotechnology: "biotechnology",
    "life sciences": "life-sciences",
    "medical devices": "medical-devices",
    diagnostics: "diagnostics",

    // ========== OPERATIONS & SUPPLY CHAIN ==========
    operations: "operations",
    ops: "operations",
    "operations management": "operations-management",
    "supply chain": "supply-chain",
    "supply chain management": "supply-chain-management",
    scm: "supply-chain-management",
    logistics: "logistics",
    procurement: "procurement",
    sourcing: "sourcing",
    "vendor management": "vendor-management",
    "supplier management": "supplier-management",
    "inventory management": "inventory-management",
    "warehouse management": "warehouse-management",
    wms: "warehouse-management-system",
    distribution: "distribution",
    fulfillment: "fulfillment",
    "3pl": "third-party-logistics",
    freight: "freight-management",
    shipping: "shipping",
    "import export": "import-export",
    customs: "customs",
    "demand planning": "demand-planning",
    "s&op": "sales-operations-planning",
    "sales and operations planning": "sales-operations-planning",
    mrp: "material-requirements-planning",
    "erp systems": "erp",
    "sap erp": "sap",
    "oracle scm": "oracle-scm",
    "lean manufacturing": "lean-methodology",
    "six sigma": "six-sigma",
    "lean six sigma": "lean-six-sigma",
    "continuous improvement": "continuous-improvement",
    kaizen: "kaizen",
    "process improvement": "process-improvement",
    bpm: "business-process-management",
    "business process management": "business-process-management",

    // ========== HR & RECRUITING ==========
    hr: "human-resources",
    "human resources": "human-resources",
    recruiting: "recruiting",
    recruitment: "recruiting",
    "talent acquisition": "talent-acquisition",
    ta: "talent-acquisition",
    "candidate sourcing": "sourcing-candidates",
    interviewing: "interviewing",
    onboarding: "onboarding",
    offboarding: "offboarding",
    "employee relations": "employee-relations",
    "hr operations": "hr-operations",
    hris: "hris",
    workday: "workday",
    bamboohr: "bamboohr",
    adp: "adp",
    payroll: "payroll",
    compensation: "compensation",
    benefits: "benefits-administration",
    "total rewards": "total-rewards",
    "performance management": "performance-management",
    "talent management": "talent-management",
    "succession planning": "succession-planning",
    "learning and development": "learning-development",
    "l&d": "learning-development",
    training: "training",
    dei: "diversity-equity-inclusion",
    diversity: "diversity-equity-inclusion",
    inclusion: "diversity-equity-inclusion",
    "employee engagement": "employee-engagement",
    culture: "company-culture",
    "employer branding": "employer-branding",
    ats: "applicant-tracking-system",
    "applicant tracking": "applicant-tracking-system",
    greenhouse: "greenhouse",
    lever: "lever",
    icims: "icims",
    "linkedin recruiter": "linkedin-recruiter",
};

/**
 * Skill categories for grouping - expanded for all industries
 */
export const SKILL_CATEGORIES: Record<string, string[]> = {
    // Tech Categories
    frontend: [
        "javascript",
        "typescript",
        "reactjs",
        "vuejs",
        "angular",
        "nextjs",
        "html",
        "css",
        "tailwindcss",
        "sass",
        "svelte",
        "gatsby",
        "remix",
        "webpack",
        "vite",
        "storybook",
        "material-ui",
        "chakra-ui",
        "bootstrap",
        "responsive-design",
        "web-accessibility",
    ],
    backend: [
        "nodejs",
        "python",
        "java",
        "golang",
        "ruby",
        "php",
        "csharp",
        "rust",
        "scala",
        "expressjs",
        "fastapi",
        "django",
        "flask",
        "spring-boot",
        "ruby-on-rails",
        "laravel",
        "dotnet",
        "aspnet",
        "nestjs",
        "koa",
    ],
    database: [
        "postgresql",
        "mysql",
        "mongodb",
        "redis",
        "elasticsearch",
        "aws-dynamodb",
        "sql-server",
        "oracle-database",
        "cassandra",
        "neo4j",
        "couchbase",
        "sqlite",
        "mariadb",
        "cockroachdb",
        "sql",
        "nosql",
        "timescaledb",
        "influxdb",
    ],
    cloud: [
        "amazon-web-services",
        "google-cloud-platform",
        "microsoft-azure",
        "docker",
        "kubernetes",
        "aws-ec2",
        "aws-s3",
        "aws-lambda",
        "aws-rds",
        "aws-eks",
        "aws-ecs",
        "serverless",
        "digitalocean",
        "heroku",
        "vercel",
        "netlify",
        "cloudflare",
    ],
    devops: [
        "docker",
        "kubernetes",
        "terraform",
        "ansible",
        "cicd",
        "jenkins",
        "github-actions",
        "gitlab-ci",
        "argocd",
        "helm",
        "prometheus",
        "grafana",
        "datadog",
        "nginx",
        "linux",
        "bash",
        "shell-scripting",
        "hashicorp-vault",
        "istio",
    ],
    "ai-ml": [
        "machine-learning",
        "deep-learning",
        "tensorflow",
        "pytorch",
        "langchain",
        "natural-language-processing",
        "computer-vision",
        "large-language-models",
        "scikit-learn",
        "keras",
        "huggingface",
        "pandas",
        "numpy",
        "mlops",
        "recommendation-systems",
        "neural-networks",
        "data-science",
    ],
    mobile: [
        "ios-development",
        "android-development",
        "react-native",
        "flutter",
        "swift",
        "kotlin",
        "swiftui",
        "objective-c",
        "dart",
        "expo",
        "xamarin",
        "ionic",
    ],
    "data-engineering": [
        "sql",
        "python",
        "pandas",
        "data-engineering",
        "data-science",
        "business-intelligence",
        "apache-spark",
        "apache-kafka",
        "apache-airflow",
        "dbt",
        "etl",
        "elt",
        "snowflake",
        "aws-redshift",
        "google-bigquery",
        "databricks",
        "data-warehouse",
        "data-lake",
        "data-modeling",
        "presto",
        "trino",
    ],
    security: [
        "cybersecurity",
        "information-security",
        "application-security",
        "devsecops",
        "penetration-testing",
        "owasp",
        "oauth",
        "jwt",
        "encryption",
        "ssl-tls",
        "soc2-compliance",
        "hipaa-compliance",
        "gdpr-compliance",
        "vulnerability-assessment",
    ],
    testing: [
        "jest",
        "mocha",
        "cypress",
        "playwright",
        "selenium",
        "pytest",
        "junit",
        "test-driven-development",
        "behavior-driven-development",
        "unit-testing",
        "integration-testing",
        "e2e-testing",
        "load-testing",
        "performance-testing",
    ],

    // Business Categories
    "finance-accounting": [
        "financial-analysis",
        "financial-modeling",
        "budgeting",
        "forecasting",
        "gaap",
        "ifrs",
        "auditing",
        "taxation",
        "accounts-payable",
        "accounts-receivable",
        "microsoft-excel",
        "advanced-excel",
        "pivot-tables",
        "sap",
        "netsuite",
        "quickbooks",
        "financial-reporting",
        "management-reporting",
        "erp",
    ],
    marketing: [
        "digital-marketing",
        "content-marketing",
        "seo",
        "sem",
        "pay-per-click",
        "google-ads",
        "facebook-ads",
        "google-analytics",
        "social-media-marketing",
        "email-marketing",
        "marketing-automation",
        "hubspot",
        "marketo",
        "salesforce-marketing-cloud",
        "content-strategy",
        "ab-testing",
        "conversion-rate-optimization",
        "growth-marketing",
    ],
    sales: [
        "sales",
        "b2b-sales",
        "enterprise-sales",
        "saas-sales",
        "account-executive",
        "account-management",
        "customer-success",
        "business-development",
        "lead-generation",
        "pipeline-management",
        "closing",
        "negotiation",
        "salesforce",
        "hubspot-crm",
        "consultative-selling",
        "solution-selling",
        "product-demos",
    ],
    healthcare: [
        "healthcare",
        "electronic-health-records",
        "epic-systems",
        "cerner",
        "hl7",
        "fhir",
        "medical-coding",
        "medical-billing",
        "revenue-cycle-management",
        "clinical-trials",
        "hipaa-compliance",
        "healthcare-analytics",
        "telehealth",
        "pharmaceutical",
        "biotechnology",
    ],
    operations: [
        "operations",
        "operations-management",
        "supply-chain-management",
        "logistics",
        "procurement",
        "inventory-management",
        "warehouse-management",
        "lean-methodology",
        "six-sigma",
        "lean-six-sigma",
        "continuous-improvement",
        "process-improvement",
        "sap",
        "erp",
        "demand-planning",
    ],
    "hr-recruiting": [
        "human-resources",
        "recruiting",
        "talent-acquisition",
        "onboarding",
        "employee-relations",
        "workday",
        "bamboohr",
        "adp",
        "payroll",
        "compensation",
        "benefits-administration",
        "performance-management",
        "learning-development",
        "diversity-equity-inclusion",
        "applicant-tracking-system",
        "greenhouse",
        "lever",
    ],
    "project-management": [
        "project-management",
        "product-management",
        "agile",
        "scrum",
        "kanban",
        "jira",
        "confluence",
        "asana",
        "trello",
        "linear",
        "sprint-planning",
        "backlog-refinement",
        "user-stories",
        "okrs",
        "stakeholder-management",
    ],
    "soft-skills": [
        "leadership",
        "people-management",
        "communication",
        "presentation-skills",
        "problem-solving",
        "critical-thinking",
        "teamwork",
        "collaboration",
        "mentoring",
        "coaching",
        "negotiation",
        "time-management",
        "adaptability",
    ],
};

// Stop words for keyword extraction
const STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "as",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "also",
    "now",
    "about",
    "any",
    "both",
    "our",
    "your",
    "their",
    "this",
    "that",
    "these",
    "those",
    "i",
    "me",
    "my",
    "we",
    "us",
    "you",
    "he",
    "him",
    "his",
    "she",
    "her",
    "it",
    "its",
    "they",
    "them",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "if",
    "while",
    "although",
    "because",
    "until",
    "unless",
    "since",
    "even",
    "though",
    "whether",
    "either",
    "neither",
    "yet",
    "however",
    "therefore",
    "thus",
    "hence",
    "etc",
    "ie",
    "eg",
    "vs",
    "via",
    "per",
    "re",
    "including",
    "include",
    "includes",
    "included",
    "using",
    "use",
    "used",
    "work",
    "working",
    "worked",
    "works",
    "like",
    "new",
    "first",
    "last",
    "best",
    "well",
    "also",
    "back",
    "only",
    "come",
    "make",
    "take",
    "over",
    "good",
    "year",
    "years",
    "day",
    "days",
    "time",
    "experience",
    "experienced",
    "strong",
    "excellent",
    "ability",
    "able",
    "skills",
    "skill",
    "knowledge",
    "proficient",
    "proficiency",
    "understand",
    "understanding",
    "familiar",
    "familiarity",
    "exposure",
    "team",
    "teams",
    "company",
    "companies",
    "role",
    "roles",
    "position",
    "positions",
    "job",
    "jobs",
    "candidate",
    "candidates",
    "required",
    "requirements",
    "requirement",
    "preferred",
    "plus",
    "bonus",
    "nice",
    "ideal",
    "ideally",
    "minimum",
    "maximum",
]);

/**
 * Normalize a skill name to its canonical form
 */
export function normalizeSkill(skill: string): string {
    const lowered = skill.toLowerCase().trim();

    // Check for exact alias match
    if (SKILL_ALIASES[lowered]) {
        return SKILL_ALIASES[lowered];
    }

    // Remove common suffixes/prefixes
    const normalized = lowered
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .replace(/^-+|-+$/g, "");

    // Check again after normalization
    if (SKILL_ALIASES[normalized]) {
        return SKILL_ALIASES[normalized];
    }

    return normalized;
}

/**
 * Normalize an array of skills
 */
export function normalizeSkills(skills: string[]): string[] {
    const normalized = skills.map(normalizeSkill);
    // Remove duplicates
    return [...new Set(normalized)];
}

/**
 * Get the category for a skill
 */
export function getSkillCategory(skill: string): string | null {
    const normalized = normalizeSkill(skill);

    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
        if (skills.includes(normalized)) {
            return category;
        }
    }

    return null;
}

/**
 * Check if two skills are similar (aliases of each other)
 */
export function areSkillsSimilar(skill1: string, skill2: string): boolean {
    return normalizeSkill(skill1) === normalizeSkill(skill2);
}

/**
 * Get related skills from the same category
 */
export function getRelatedSkills(skill: string): string[] {
    const category = getSkillCategory(skill);
    if (!category) return [];

    const normalized = normalizeSkill(skill);
    return SKILL_CATEGORIES[category].filter((s) => s !== normalized);
}

// ============================================================================
// KEYWORD SIMILARITY ENGINE
// Industry-standard text matching for ATS scoring
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of skills
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create matrix
    const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    // Initialize base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] =
                    1 +
                    Math.min(
                        dp[i - 1][j], // deletion
                        dp[i][j - 1], // insertion
                        dp[i - 1][j - 1] // substitution
                    );
            }
        }
    }

    return dp[m][n];
}

/**
 * Calculate string similarity ratio (0-1)
 */
export function stringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - distance / maxLen;
}

/**
 * Extract meaningful keywords from text
 * Removes stop words and normalizes
 */
export function extractKeywords(text: string): string[] {
    // Tokenize and clean
    const words = text
        .toLowerCase()
        .replace(/[^\w\s+#.-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));

    // Normalize skills and return unique
    const normalized = words
        .map((word) => {
            // Keep version numbers and special formats
            if (/^\d+(\.\d+)*$/.test(word)) return null; // Skip pure version numbers
            if (/^[a-z]+\d+$/.test(word)) return word; // Keep things like "python3"

            // Try to normalize as skill
            const normalizedSkill = normalizeSkill(word);
            return normalizedSkill || word;
        })
        .filter((w): w is string => w !== null);

    return [...new Set(normalized)];
}

/**
 * Extract n-grams (multi-word phrases) from text
 */
export function extractNGrams(text: string, n: number = 2): string[] {
    const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 2);
    const ngrams: string[] = [];

    for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(" ");
        ngrams.push(ngram);
    }

    return ngrams;
}

/**
 * Calculate TF-IDF inspired keyword importance
 */
export function calculateTermFrequency(terms: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const total = terms.length;

    for (const term of terms) {
        tf.set(term, (tf.get(term) || 0) + 1);
    }

    // Normalize by total terms
    for (const [term, count] of tf) {
        tf.set(term, count / total);
    }

    return tf;
}

/**
 * Find matching skills with fuzzy matching support
 */
export function findFuzzyMatches(
    candidateSkills: string[],
    jobSkills: string[],
    threshold: number = 0.8
): { exact: number; fuzzy: number; partial: number } {
    let exact = 0;
    let fuzzy = 0;
    let partial = 0;

    const matchedJob = new Set<string>();

    for (const candSkill of candidateSkills) {
        const normalizedCand = normalizeSkill(candSkill);

        for (const jobSkill of jobSkills) {
            if (matchedJob.has(jobSkill)) continue;

            const normalizedJob = normalizeSkill(jobSkill);

            // Exact match after normalization
            if (normalizedCand === normalizedJob) {
                exact++;
                matchedJob.add(jobSkill);
                break;
            }

            // Fuzzy match
            const similarity = stringSimilarity(normalizedCand, normalizedJob);
            if (similarity >= threshold) {
                fuzzy++;
                matchedJob.add(jobSkill);
                break;
            }

            // Partial match (one contains the other)
            if (normalizedCand.includes(normalizedJob) || normalizedJob.includes(normalizedCand)) {
                partial++;
                matchedJob.add(jobSkill);
                break;
            }
        }
    }

    return { exact, fuzzy, partial };
}

/**
 * Calculate keyword-based similarity between two texts
 * Industry-standard ATS scoring without embeddings
 *
 * @param candidateText - Text from candidate resume/profile
 * @param jobText - Text from job description/requirements
 * @returns Similarity score between 0 and 1
 */
export function calculateKeywordSimilarity(candidateText: string, jobText: string): number {
    if (!candidateText || !jobText) return 0;

    // Extract keywords from both texts
    const candidateKeywords = extractKeywords(candidateText);
    const jobKeywords = extractKeywords(jobText);

    if (jobKeywords.length === 0) return 0;
    if (candidateKeywords.length === 0) return 0;

    // 1. Exact and fuzzy skill matching (40% weight)
    const matches = findFuzzyMatches(candidateKeywords, jobKeywords);
    const skillMatchScore = Math.min(
        1,
        (matches.exact * 1.0 + matches.fuzzy * 0.8 + matches.partial * 0.5) / jobKeywords.length
    );

    // 2. Jaccard similarity of normalized keywords (30% weight)
    const candidateSet = new Set(candidateKeywords.map((k) => normalizeSkill(k)));
    const jobSet = new Set(jobKeywords.map((k) => normalizeSkill(k)));
    const intersection = new Set([...candidateSet].filter((x) => jobSet.has(x)));
    const union = new Set([...candidateSet, ...jobSet]);
    const jaccardScore = union.size > 0 ? intersection.size / union.size : 0;

    // 3. N-gram matching for phrases (20% weight)
    const candidateBigrams = extractNGrams(candidateText, 2);
    const jobBigrams = extractNGrams(jobText, 2);
    const candidateBigramSet = new Set(candidateBigrams);
    const bigramMatches = jobBigrams.filter((bg) => candidateBigramSet.has(bg)).length;
    const bigramScore =
        jobBigrams.length > 0 ? Math.min(1, bigramMatches / Math.min(10, jobBigrams.length)) : 0;

    // 4. Category coverage (10% weight)
    // Check if candidate covers same skill categories as job
    const candidateCategories = new Set<string>();
    const jobCategories = new Set<string>();

    for (const skill of candidateKeywords) {
        const cat = getSkillCategory(skill);
        if (cat) candidateCategories.add(cat);
    }
    for (const skill of jobKeywords) {
        const cat = getSkillCategory(skill);
        if (cat) jobCategories.add(cat);
    }

    const categoryOverlap =
        jobCategories.size > 0
            ? [...jobCategories].filter((c) => candidateCategories.has(c)).length /
              jobCategories.size
            : 0;

    // Weighted combination
    const finalScore =
        skillMatchScore * 0.4 + jaccardScore * 0.3 + bigramScore * 0.2 + categoryOverlap * 0.1;

    return Math.min(1, Math.max(0, finalScore));
}

/**
 * Calculate skill match percentage
 * Used for detailed skill gap analysis
 */
export function calculateSkillMatchPercentage(
    candidateSkills: string[],
    requiredSkills: string[]
): { percentage: number; matched: string[]; missing: string[] } {
    if (requiredSkills.length === 0) {
        return { percentage: 100, matched: [], missing: [] };
    }

    const normalizedCandidate = new Set(candidateSkills.map(normalizeSkill));
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of requiredSkills) {
        const normalized = normalizeSkill(skill);

        // Check exact match
        if (normalizedCandidate.has(normalized)) {
            matched.push(skill);
            continue;
        }

        // Check fuzzy match
        let found = false;
        for (const candSkill of normalizedCandidate) {
            if (stringSimilarity(candSkill, normalized) >= 0.8) {
                matched.push(skill);
                found = true;
                break;
            }
        }

        if (!found) {
            missing.push(skill);
        }
    }

    return {
        percentage: (matched.length / requiredSkills.length) * 100,
        matched,
        missing,
    };
}

/**
 * Score candidate skills against job requirements with detailed breakdown
 */
export function scoreSkillsMatch(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[] = []
): {
    totalScore: number;
    requiredScore: number;
    preferredScore: number;
    details: {
        requiredMatched: string[];
        requiredMissing: string[];
        preferredMatched: string[];
        preferredMissing: string[];
    };
} {
    const requiredResult = calculateSkillMatchPercentage(candidateSkills, requiredSkills);
    const preferredResult = calculateSkillMatchPercentage(candidateSkills, preferredSkills);

    // Required skills have 70% weight, preferred have 30%
    const preferredWeight = 0.3;

    // If no preferred skills, required gets full weight
    const effectivePreferredWeight = preferredSkills.length > 0 ? preferredWeight : 0;
    const effectiveRequiredWeight = 1 - effectivePreferredWeight;

    const totalScore =
        requiredResult.percentage * effectiveRequiredWeight +
        preferredResult.percentage * effectivePreferredWeight;

    return {
        totalScore,
        requiredScore: requiredResult.percentage,
        preferredScore: preferredResult.percentage,
        details: {
            requiredMatched: requiredResult.matched,
            requiredMissing: requiredResult.missing,
            preferredMatched: preferredResult.matched,
            preferredMissing: preferredResult.missing,
        },
    };
}
