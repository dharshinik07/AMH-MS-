export const BRANCH_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
];

export function getBranchImage(branchIdOrIndex: string | number): string {
  let idx = 0;
  if (typeof branchIdOrIndex === "number") {
    idx = Math.abs(branchIdOrIndex) % BRANCH_IMAGES.length;
  } else {
    let hash = 0;
    for (let i = 0; i < branchIdOrIndex.length; i++) {
      hash = (hash << 5) - hash + branchIdOrIndex.charCodeAt(i);
      hash |= 0;
    }
    idx = Math.abs(hash) % BRANCH_IMAGES.length;
  }
  return BRANCH_IMAGES[idx];
}

const BRANCH_CODE_MAP: Record<string, string> = {
  "branch-1": "MDP",
  "branch-2": "SAN",
  "branch-3": "ETB",
  "branch-4": "WTB",
  "branch-5": "CMP",
  "branch-6": "SLY",
  "branch-7": "PRG",
  "branch-8": "KAD",
};

export function getBranchCode(branchId: string, branchName?: string): string {
  if (BRANCH_CODE_MAP[branchId]) return BRANCH_CODE_MAP[branchId];
  if (!branchName) return "AMH";
  const words = branchName.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  }
  return branchName.substring(0, 3).toUpperCase();
}
