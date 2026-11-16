"""Complexity classifier (SDD 6.2, SRS FR-20, PER-5, BR-7).

It rates a message Low, Medium or High with simple rules. No model call, so it answers
instantly (PER-5: under 1 second), costs nothing and gives the same answer every time.

How it decides: it adds up points.
  length of the message       0 to 3 points
  "hard task" words           +2 each (at most 4 words counted)  e.g. analyze, design, debug
  "ordinary task" words       +1 each (at most 2 words counted)  e.g. explain, write, summarize
  code in the message         +2
  arithmetic                  +1
  more than one question      +1
  a simple lookup or greeting -1 (only when no task words are present)
Points -> level:  0 or less = Low,  1 to 3 = Medium,  4 or more = High.

BR-7: when we are not sure, the answer is High (the stronger model). We are "not sure" when
  - a simple-lookup phrase and a hard-task word appear together (mixed signals), or
  - the message is long but contains no task words at all, so we cannot tell what it needs.
If the classifier itself crashes, the answer is also High (SRS 11.0.E2).
"""

import re
from dataclasses import dataclass

from app.routing.types import Complexity


@dataclass(frozen=True)
class Rating:
    level: Complexity
    reason: str  # short sentence that explains the rating (shown in the log later)
    uncertain: bool = False


# Each cue is (label, regular expression). Matching is on the lower-case message.
HARD_CUES = [
    ("analyze", r"\banaly[sz]"),
    ("compare", r"\bcompar(e|ing|ison)"),
    ("trade-off", r"\btrade-?offs?\b"),
    ("design", r"\bdesign"),
    ("architecture", r"\barchitect"),
    ("debug", r"\bdebug"),
    ("prove", r"\bprove\b|\bproof\b"),
    ("derive", r"\bderive\b|\bderivation\b"),
    ("optimize", r"\boptimi[sz]"),
    ("strategy", r"\bstrateg"),
    ("evaluate", r"\bevaluat"),
    ("pros and cons", r"\bpros and cons\b"),
    ("refactor", r"\brefactor"),
    ("algorithm", r"\balgorithm"),
    ("implement", r"\bimplement"),
    ("research", r"\bresearch\b"),
    ("plan", r"\bplan(s|ning)?\b"),
    ("step by step", r"\bstep[- ]by[- ]step\b"),
    ("in depth", r"\bin[- ]depth\b"),
]

MEDIUM_CUES = [
    ("explain", r"\bexplain"),
    ("summarize", r"\bsummari[sz]"),
    ("write", r"\bwrite\b|\bdraft\b"),
    ("rewrite", r"\brewrite\b|\brephrase\b"),
    ("translate", r"\btranslat"),
    ("describe", r"\bdescribe\b"),
    ("outline", r"\boutline\b"),
    ("list", r"\blist\b"),
    ("convert", r"\bconvert\b"),
    ("fix", r"\bfix\b"),
    ("how to", r"\bhow (do|can|to|would)\b"),
]

# A greeting or a very simple lookup.
LOW_CUES = [
    ("greeting", r"^\s*(hi|hello|hey|thanks|thank you|ok|okay|good (morning|afternoon|evening))\b"),
    ("simple question", r"^\s*(what|who|where) (is|are|was)\b|^\s*(define|when did)\b"),
    ("capital of", r"\bcapital of\b"),
    ("how are you", r"\bhow are you\b"),
]

CODE_PATTERN = re.compile(r"```|\bdef \w+\(|\bclass \w+|\bimport \w+|[{};]\s*$", re.MULTILINE)
MATH_PATTERN = re.compile(r"\d+\s*[-+*/^=]\s*\d+")

MAX_HARD_COUNTED = 4
MAX_MEDIUM_COUNTED = 2
LONG_WITHOUT_CUES_WORDS = 40


def _length_points(words: int) -> int:
    if words <= 12:
        return 0
    if words <= 40:
        return 1
    if words <= 120:
        return 2
    return 3


def _matches(cues: list[tuple[str, str]], text: str) -> list[str]:
    return [label for label, pattern in cues if re.search(pattern, text)]


def _rate(text: str) -> Rating:
    lowered = text.lower()
    words = len(text.split())
    if words == 0:
        return Rating(Complexity.HIGH, "empty message, cannot tell what it needs", uncertain=True)

    hard = _matches(HARD_CUES, lowered)
    medium = _matches(MEDIUM_CUES, lowered)
    low = _matches(LOW_CUES, lowered)

    # BR-7: mixed signals or no idea what is wanted -> not sure -> High.
    if low and hard:
        return Rating(
            Complexity.HIGH,
            f"mixed signals ({low[0]} but also {hard[0]}), so treated as High",
            uncertain=True,
        )
    if words > LONG_WITHOUT_CUES_WORDS and not hard and not medium:
        return Rating(
            Complexity.HIGH,
            f"long message ({words} words) with no clear task words, so treated as High",
            uncertain=True,
        )

    parts = []
    score = _length_points(words)
    parts.append(f"length {score}")
    if hard:
        points = 2 * min(len(hard), MAX_HARD_COUNTED)
        score += points
        parts.append(f"hard words {', '.join(hard)} +{points}")
    if medium:
        points = min(len(medium), MAX_MEDIUM_COUNTED)
        score += points
        parts.append(f"task words {', '.join(medium)} +{points}")
    if CODE_PATTERN.search(text):
        score += 2
        parts.append("contains code +2")
    if MATH_PATTERN.search(lowered):
        score += 1
        parts.append("arithmetic +1")
    if text.count("?") > 1:
        score += 1
        parts.append("several questions +1")
    if low and not hard and not medium:
        score -= 1
        parts.append(f"{low[0]} -1")

    if score <= 0:
        level = Complexity.LOW
    elif score <= 3:
        level = Complexity.MEDIUM
    else:
        level = Complexity.HIGH
    return Rating(level, f"score {score}: " + "; ".join(parts))


def rate(text: str) -> Rating:
    """Rate a message. Never raises: a crash is rated High (SRS 11.0.E2)."""
    try:
        return _rate(text)
    except Exception as error:
        return Rating(
            Complexity.HIGH,
            f"classifier failed ({type(error).__name__}), so treated as High",
            uncertain=True,
        )
