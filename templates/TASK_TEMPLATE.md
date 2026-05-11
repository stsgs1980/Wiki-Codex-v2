# Шаблоны промптов для подагентов

> Шаблоны для вызова подагентов с интеграцией worklog.
> Полное руководство: см. `README_WORKLOG.md`

---

## Быстрый старт

Скопируйте нужный шаблон, замените `<ID>` и `<описание>` на ваши значения.

---

## Шаблон: full-stack-developer

```javascript
Task({
  description: "<описание>",
  prompt: `
## WORKLOG - ОБЯЗАТЕЛЬНО

Task ID: **<ID>**

1. Прочитай /home/z/my-project/worklog.md
2. После работы добавь запись (НЕ перезаписывать!)

---
Task ID: <ID>
Agent: full-stack-developer
Task: <описание>
Work Log:
- <действия>
Stage Summary:
- Files: <список>
- Status: completed
---

## ЗАДАЧА
<описание задачи>
`,
  subagent_type: "full-stack-developer"
});
```

---

## Шаблон: Explore

```javascript
Task({
  description: "<описание>",
  prompt: `
## WORKLOG - ОБЯЗАТЕЛЬНО

Task ID: **<ID>**

1. Прочитай /home/z/my-project/worklog.md
2. После работы добавь запись (НЕ перезаписывать!)

---
Task ID: <ID>
Agent: Explore
Task: <описание>
Work Log:
- <действия>
Stage Summary:
- Findings: <результаты>
- Status: completed
---

## ЗАДАЧА
<описание задачи>
`,
  subagent_type: "Explore"
});
```

---

## Шаблон: general-purpose

```javascript
Task({
  description: "<описание>",
  prompt: `
## WORKLOG - ОБЯЗАТЕЛЬНО

Task ID: **<ID>**

1. Прочитай /home/z/my-project/worklog.md
2. После работы добавь запись (НЕ перезаписывать!)

---
Task ID: <ID>
Agent: general-purpose
Task: <описание>
Work Log:
- <действия>
Stage Summary:
- Result: <результат>
- Status: completed
---

## ЗАДАЧА
<описание задачи>
`,
  subagent_type: "general-purpose"
});
```

---

## Формат записи в worklog

````markdown
---
Task ID: <ID>
Agent: <тип агента>
Task: <описание задачи>

Work Log:
- <действие 1>
- <действие 2>

Stage Summary:
- Files created: <список>
- Files modified: <список>
- Key decisions: <решения>
- Status: completed
---
````

---

Подробное описание системы worklog, чек-листы и FAQ: см. `README_WORKLOG.md`

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
