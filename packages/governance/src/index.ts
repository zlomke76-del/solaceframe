export type GovernanceDecision =
  | "allow"
  | "conditional"
  | "blocked";

export interface GovernancePacket {
  stateValid: boolean;
  authorityPresent: boolean;
  likenessAllowed: boolean;
  continuityStable: boolean;
}

export function evaluate(packet: GovernancePacket): GovernanceDecision {
  if (
    packet.stateValid &&
    packet.authorityPresent &&
    packet.likenessAllowed &&
    packet.continuityStable
  ) {
    return "allow";
  }

  return "conditional";
}
