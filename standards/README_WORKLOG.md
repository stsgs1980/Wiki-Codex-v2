# Система Worklog - Полное руководство

> Сохраните эту папку себе и используйте как справочник

---

## Суть в одном абзаце

**Worklog** - это общий журнал работы агентов. Super Z (главный агент) координирует работу и вызывает подагентов. Подагенты - это **отдельные модели с другими инструкциями**, поэтому они НЕ знают о worklog автоматически. Чтобы они работали с worklog - нужно **явно передать инструкции в промпте при вызове Task()**.

---

## Файлы системы

| Файл | Назначение |
|------|------------|
| worklog.md | Журнал работы агентов (на сервере) |
| README_WORKLOG.md | Это руководство (главный документ) |
| TASK_TEMPLATE.md | Готовые шаблоны промптов |
| No-Unicode_Policy_v2.1.md | Стандарт использования символов |
| MARKDOWN_STANDARD_RU_v2.1.md | Стандарт оформления .md файлов |
| README_TEMPLATE.md | Шаблон README |

---

## Структура worklog.md

```text
/home/z/my-project/worklog.md
|
+-- Заголовок и описание
+-- Таблица Task ID
+-- История работы
    +-- Запись агента 1
    +-- Запись агента 2
    +-- ...
```

---

## Система Task ID

| Паттерн | Пример | Когда использовать |
|---------|--------|-------------------|
| N | 1, 2, 3 | Последовательные задачи |
| N-x | 2-a, 2-b | Параллельные задачи |
| N-x-y | 2-a-1 | Вложенные подзадачи |

---

## ГЛАВНОЕ ПРАВИЛО

```text
Super Z - ЗНАЕТ о worklog (из системных инструкций)

Подагенты - НЕ ЗНАЮТ о worklog (другие инструкции)
            |
            v
Нужно ПЕРЕДАТЬ в промпте при вызове Task()
```

---

## Как вызывать подагента

### Копируйте этот шаблон:

```javascript
Task({
  description: "Краткое описание",
  prompt: `
## WORKLOG - ОБЯЗАТЕЛЬНО

Твой Task ID: **2-a**

1. ПЕРЕД работой: прочитай /home/z/my-project/worklog.md
2. ПОСЛЕ работы: ДОБАВИТЬ запись в конец файла (НЕ перезаписывать!)

Формат записи:
---
Task ID: 2-a
Agent: full-stack-developer
Task: <что сделал>
Work Log:
- <действие 1>
- <действие 2>
Stage Summary:
- Files: <список файлов>
- Status: completed
---

## ЗАДАЧА

<Опишите задачу здесь>
`,
  subagent_type: "full-stack-developer"
});
```

---

## Формат записи в worklog

```markdown
---
Task ID: 2-a
Agent: full-stack-developer
Task: Создание API пользователей

Work Log:
- Создан файл /app/api/users/route.ts
- Добавлена валидация Zod
- Написаны тесты

Stage Summary:
- Files created: src/app/api/users/route.ts
- Files modified: src/lib/validators.ts
- Key decisions: REST API, JWT auth
- Status: completed
```

---

## Workflow диаграмма

```text
1. Super Z создаёт TODO-лист и определяет Task ID
   |
   v
2. Super Z вызывает подагента с промптом (включая правила worklog)
   |
   v
3. Подагент:
   a) Читает worklog.md
   b) Выполняет задачу
   c) Добавляет запись в worklog.md
   |
   v
4. Super Z проверяет worklog и обновляет TODO-лист
```

---

## Чек-лист перед вызовом агента

- [ ] Определён Task ID
- [ ] В промпте есть путь к worklog.md
- [ ] В промпте есть инструкция "ПРОЧИТАТЬ перед работой"
- [ ] В промпте есть инструкция "ДОБАВИТЬ после работы"
- [ ] В промпте есть формат записи
- [ ] В промпте есть "НЕ перезаписывать"

---

## Быстрые шаблоны

### Для full-stack-developer:

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

### Для Explore:

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

## Частые вопросы

**Q: Почему подагент не пишет в worklog?**
A: Вы не передали инструкции в промпте. Подагенты не знают о worklog автоматически.

**Q: Где должен быть worklog.md?**
A: Только на сервере: /home/z/my-project/worklog.md. Агенты не имеют доступа к вашему локальному компьютеру.

**Q: Как скачать worklog себе?**
A: После завершения проекта скачайте папку /home/z/my-project/ через интерфейс.

**Q: Можно ли использовать другие ID?**
A: Да, но следуйте системе: 1, 2, 3 - последовательно, 2-a, 2-b - параллельно.

---

## Что сохранить себе

```text
worklog-system/
+-- README_WORKLOG.md     <- Главный документ (этот)
+-- TASK_TEMPLATE.md      <- Шаблоны промптов
+-- worklog.md            <- Пример структуры журнала
+-- No-Unicode_Policy_v2.1.md  <- Стандарт символов
+-- MARKDOWN_STANDARD_RU_v2.1.md <- Стандарт оформления .md
+-- README_TEMPLATE.md <- Шаблон README
```

---

Версия: 2.1.1
Обновлено: 2025-01-09
Соответствует: No-Unicode Policy v2.1, MARKDOWN_STANDARD v2.1

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
