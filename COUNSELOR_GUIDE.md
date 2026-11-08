# AdmitFlow AI — Counselor Operating Guide

This guide is designed for admission counselors, academic tele-callers, and student relationship managers using AdmitFlow AI daily.

---

## 1. Daily Counselor Workflow

```
┌────────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  1. Check Kanban   │ ──► │ 2. Review AI Insights│ ──► │  3. Conduct Counselling│
│  (/crm Pipeline)   │     │ (Next Best Action)   │     │  (/scheduler Slots)    │
└────────────────────┘     └──────────────────────┘     └────────────────────────┘
                                                                     │
                                                                     ▼
┌────────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  6. Track Status   │ ◄── │ 5. Verify Documents  │ ◄── │  4. Approve Follow-ups │
│  (Enrolled / Drop) │     │ (/knowledge Checklist│     │  (/followups Queue)    │
└────────────────────┘     └──────────────────────┘     └────────────────────────┘
```

---

## 2. Navigating the CRM Kanban Board (`/crm`)

Leads flow automatically across 7 stages:
1. **NEW:** Student engaged with website widget or WhatsApp bot.
2. **CONTACTED:** Student phone verified, initial prospectus delivered.
3. **INTERESTED:** Student expressed high intent (Lead Score >= 70).
4. **COUNSELLING_SCHEDULED:** 1-on-1 career counselling appointment booked.
5. **TRIAL_CLASS:** Student attended 3-day demo class pass.
6. **ADMISSION_CONFIRMED:** Seat confirmed with installment paid.
7. **LOST:** Student dropped out or chose another competitor (reason recorded).

---

## 3. Human-In-The-Loop Follow-up Approvals (`/followups`)

* AdmitFlow AI prepares context-aware WhatsApp messages for students who went quiet.
* As a counselor, you have 100% control:
  * **Approve & Send:** Queues the message for immediate delivery.
  * **Edit:** Fine-tune the tone or add custom scholarship terms.
  * **Reject:** Dismisses follow-up if student already visited the campus in person.
