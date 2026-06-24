export interface PersonAccount {
  Id: string
  Name: string
  FirstName: string | null
  LastName: string | null
  IsPersonAccount: boolean
  PersonEmail: string | null
  PersonMobilePhone: string | null
  PersonBirthdate: string | null
  PersonContactId?: string | null
  BillingCity: string | null
  BillingCountry: string | null
  Owner?: { Name: string }
  CreatedDate: string
  /** URL pública con la foto del cliente (poblado por configuración de Cust360 en el org). */
  Cust360_Contact_Picture_URL__pc?: string | null
}

export interface Opportunity {
  Id: string
  Name: string
  StageName: string
  Amount: number | null
  CloseDate: string
  Probability: number
  Type: string | null
  NextStep?: string | null
  Description?: string | null
  LeadSource?: string | null
  ExpectedRevenue?: number | null
  ForecastCategoryName?: string | null
  Owner?: { Name: string }
  CreatedDate?: string
  LastModifiedDate?: string
}

export interface FinancialAccount {
  Id: string
  Name: string
  FinServ__FinancialAccountType__c: string
  FinServ__Status__c: string
  FinServ__Balance__c: number
  FinServ__OpenDate__c: string
}

export interface Case {
  Id: string
  CaseNumber: string
  Subject: string | null
  Status: string
  Priority: string
  Type: string | null
  Reason: string | null
  Origin: string
  Description?: string | null
  ContactId?: string | null
  Contact?: { Name: string } | null
  Owner?: { Name: string }
  IsEscalated?: boolean
  CreatedDate: string
  ClosedDate: string | null
  LastModifiedDate?: string
}

export interface Event {
  Id: string
  Subject: string
  StartDateTime: string
  EndDateTime: string | null
  IsAllDayEvent: boolean
  Location?: string | null
  Description?: string | null
  Type?: string | null
  WhatId?: string | null
  WhoId?: string | null
  What?: { Name?: string } | null
  Who?: { Name?: string } | null
  Owner?: { Name?: string } | null
  CreatedDate?: string
  LastModifiedDate?: string
}

export interface Task {
  Id: string
  Subject: string
  ActivityDate: string | null
  Status: string
  Priority: string
  Description?: string | null
  Type?: string | null
  WhatId?: string | null
  WhoId?: string | null
  What?: { Name?: string } | null
  Who?: { Name?: string } | null
  Owner?: { Name?: string } | null
  IsClosed?: boolean
  CreatedDate?: string
  LastModifiedDate?: string
  CompletedDateTime?: string | null
}

export interface Lead {
  Id: string
  FirstName: string | null
  LastName: string
  Company: string
  Status: string
  LeadSource: string | null
}

export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  instance_url: string
  id: string
  issued_at: string
  signature: string
  scope: string
  token_type: string
}

export interface AgentSession {
  sessionId: string
  _links?: Record<string, unknown>
}

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: string
}
