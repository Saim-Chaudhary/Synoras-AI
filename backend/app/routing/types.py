"""Shared names for the routing code: complexity levels, model tiers and the error type."""

from enum import Enum


class Complexity(str, Enum):
    """How hard a subtask is (SRS FR-20)."""

    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Tier(str, Enum):
    """Which model family runs the subtask (SRS FR-21)."""

    LOCAL = "local"  # Ollama on this machine
    SMALL_CLOUD = "small_cloud"  # Groq
    STRONG_CLOUD = "strong_cloud"  # OpenRouter


# SDD 6.2: Low -> local, Medium -> smaller cloud, High -> stronger cloud.
TIER_FOR_COMPLEXITY: dict[Complexity, Tier] = {
    Complexity.LOW: Tier.LOCAL,
    Complexity.MEDIUM: Tier.SMALL_CLOUD,
    Complexity.HIGH: Tier.STRONG_CLOUD,
}

# What went wrong when calling a model. The router and the API decide what to do from this.
#   not_configured  a key or model name is missing in .env
#   unavailable     the local model (Ollama) cannot be reached
#   unreachable     a cloud provider cannot be reached (retried 2 times)
#   server_error    the provider answered with a 5xx error (retried 2 times)
#   rate_limited    free limit reached (not retried: waiting is the only fix)
#   auth            the API key was rejected
#   model_not_found the model name does not exist (for example a free model was removed)
#   other           anything else, including an empty answer
ErrorKind = str


class ModelCallError(Exception):
    """A model call failed. `kind` says why, `message` is safe to show to the user."""

    def __init__(self, kind: ErrorKind, message: str, tier: Tier | None = None):
        super().__init__(message)
        self.kind = kind
        self.message = message
        self.tier = tier
