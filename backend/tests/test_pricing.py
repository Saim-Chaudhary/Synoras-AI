from app.routing.pricing import estimate_cost


def test_free_model_has_estimated_cost_but_zero_actual():
    cost = estimate_cost("openai/gpt-oss-20b", 1000, 2000)
    # 1000 x $0.075/M + 2000 x $0.30/M = $0.000675
    assert cost.estimated_usd == 0.000675
    assert cost.actual_usd == 0.0


def test_local_model_is_free():
    cost = estimate_cost("any-local-model", None, None, local=True)
    assert cost.estimated_usd == 0.0
    assert cost.actual_usd == 0.0


def test_unknown_model_gives_none_not_a_guess():
    cost = estimate_cost("some/unknown-model", 10, 10)
    assert cost.estimated_usd is None
    assert cost.actual_usd is None


def test_missing_token_counts_give_none():
    cost = estimate_cost("openai/gpt-oss-20b", None, 10)
    assert cost.estimated_usd is None
