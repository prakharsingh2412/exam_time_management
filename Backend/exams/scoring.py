from decimal import Decimal


def score_attempt(test, responses: dict) -> dict:
    """
    Pure function. Given a Test instance and a responses dict
    {q_no_str: "A"|"B"|"C"|"D"|None}, returns score breakdown.
    """
    correct = wrong = skipped = 0
    answer_key = test.answer_key or {}

    for q in range(1, test.total_questions + 1):
        q_str = str(q)
        user_ans = responses.get(q_str)
        correct_ans = answer_key.get(q_str)

        if not user_ans:
            skipped += 1
        elif correct_ans and user_ans == correct_ans:
            correct += 1
        else:
            wrong += 1

    score = (Decimal(correct) * test.marks_per_q) - (
        Decimal(wrong) * test.negative_marks
    )

    return {
        "score": score,
        "correct": correct,
        "wrong": wrong,
        "skipped": skipped,
    }


def build_time_analytics(test, attempt) -> dict:
    """
    Returns slowest 5, fastest 5, avg pace, ideal pace, and
    time wasted on wrong answers.
    """
    tpq = {int(k): v for k, v in (attempt.time_per_q or {}).items()}
    if not tpq:
        return {}

    sorted_items = sorted(tpq.items(), key=lambda kv: kv[1], reverse=True)
    slowest = [{"q": q, "sec": s} for q, s in sorted_items[:5]]
    fastest = [{"q": q, "sec": s} for q, s in sorted_items[-5:][::-1]]

    total_time = sum(tpq.values())
    avg = total_time / len(tpq)
    ideal = test.duration_sec / test.total_questions

    answer_key = test.answer_key or {}
    responses = attempt.responses or {}
    wrong_qs = {
        int(q)
        for q, ans in responses.items()
        if ans and ans != answer_key.get(q)
    }
    wasted = sum(tpq.get(q, 0) for q in wrong_qs)

    return {
        "total_time_sec": total_time,
        "avg_per_q_sec": round(avg, 1),
        "ideal_per_q_sec": round(ideal, 1),
        "slowest": slowest,
        "fastest": fastest,
        "time_wasted_on_wrong_sec": wasted,
    }