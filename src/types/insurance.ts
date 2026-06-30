export interface InsurancePolicy {
  Id: string
  Name: string
  PolicyType: string | null
  Status: string
  PremiumAmount: number | null
  EffectiveDate: string | null
  ExpirationDate: string | null
  NameInsuredId: string | null
  NameInsured?: { Name?: string } | null
  OwnerId?: string
  Owner?: { Name?: string } | null
  CreatedDate?: string
  LastModifiedDate?: string
}

export interface Claim {
  Id: string
  Name: string
  Status: string
  ClaimType: string | null
  Severity: string | null
  EstimatedAmount: number | null
  TotalClaimedAmount: number | null
  ApprovedAmount: number | null
  LossDate: string | null
  InitiationDate: string | null
  FinalizedDate: string | null
  IsClosed: boolean
  AccountId: string | null
  Account?: { Name?: string } | null
  PolicyNumberId: string | null
  PolicyNumber?: { Name?: string; PolicyType?: string } | null
  InsuredAssetId?: string | null
  InsuredAsset?: { Name?: string; AssetName?: string | null } | null
  Summary?: string | null
  ClaimReason?: string | null
  IncidentSiteCity?: string | null
  IncidentSiteCountry?: string | null
  OwnerId?: string
  Owner?: { Name?: string } | null
  CreatedDate?: string
  LastModifiedDate?: string
}

export interface InsuranceStats {
  insuredsCount: number
  policiesInForceCount: number
  premiumAnnual: number
  activeClaimsCount: number
  highSeverityClaimsCount: number
  renewalsNext30dCount: number
}
