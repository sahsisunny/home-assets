# Add Realtime AI Voice Assistant to Home Asset Manager

I have an existing project called **Home Asset Manager**.

I am providing you with the project's monorepo/codebase. I want you to first understand the existing implementation and then add a **realtime AI Voice Assistant** directly into the application.

This is an engineering task, not a greenfield project.

## IMPORTANT

DO NOT rebuild Home Asset Manager.

DO NOT replace the existing architecture.

DO NOT create a separate demo application.

DO NOT duplicate existing business logic.

DO NOT modify existing functionality unnecessarily.

The AI Voice Assistant must be an additional capability built on top of the existing application.

The existing application is the source of truth for user, household, asset, document, warranty, maintenance, reminder, notification, and other data.

---

# 1. Understand the Existing Product

Before changing anything, inspect the complete monorepo.

The product is a **Home Asset Manager** designed to manage:

- Household assets
- Purchase information
- Invoices and receipts
- Warranty information
- Documents
- Maintenance schedules
- Repair/service history
- Reminders
- Notifications
- Household members
- Asset ownership
- Asset locations
- Asset valuation
- Search
- Analytics

The core product principle is:

> Everything you own. Everything it needs. One place.

The existing PRD describes the product as:

> Inventory + Documents + Warranty + Maintenance + Intelligence

The voice assistant should become another interface through which users access this information and perform supported actions.

---

# 2. First Task: Analyze the Existing Monorepo

DO NOT immediately write code.

First inspect:

- Monorepo structure
- Turborepo configuration
- pnpm workspaces
- apps/mobile
- apps/web
- apps/server
- packages/db
- packages/validation
- packages/tokens
- Existing Prisma schema
- Existing REST APIs
- Existing authentication
- Existing authorization
- Existing household/member permissions
- Existing asset services
- Existing document services
- Existing warranty services
- Existing maintenance services
- Existing reminder services
- Existing notification services
- Existing search implementation
- Existing AI/OCR implementation
- Existing Gemini integration
- Existing environment variables
- Existing shared types
- Existing API client
- Existing UI components

Create a concise architecture map before implementation.

---

# 3. Main Goal

Add an AI Voice Assistant that users can access directly from the Home Asset Manager web application.

This is NOT a phone-call system.

Do NOT implement:

- PSTN
- Twilio phone calls
- SIP
- Phone numbers
- Telephony infrastructure

The first version should work through:

```text
Browser
   ↓
Microphone
   ↓
Realtime Gemini Voice
   ↓
AI Agent
   ↓
Approved Tools
   ↓
Existing Home Asset Manager Backend
   ↓
Database
   ↓
Tool Result
   ↓
Gemini
   ↓
Voice Response
   ↓
Browser Speaker
```

The user should feel like they are talking to a personal home-management assistant.

---

# 4. Example User Experience

A user opens Home Asset Manager.

There should be an AI assistant entry point, preferably a floating/global assistant button that fits naturally into the existing UI.

User clicks it.

```text
┌──────────────────────────────┐
│       Home AI Assistant      │
│                              │
│        🎙️ Listening          │
│                              │
│ "How can I help?"            │
│                              │
│ User:                        │
│ "Tell me about my washing    │
│ machine."                    │
│                              │
│ AI:                          │
│ "Your Bosch washing machine  │
│ was purchased for ₹38,999..."│
│                              │
│          🎙️                 │
└──────────────────────────────┘
```

The interaction should be realtime.

The assistant should not feel like:

```text
Record audio
↓
Upload audio
↓
Wait
↓
Transcribe
↓
Wait
↓
Generate response
↓
Generate audio
```

Use realtime/streaming capabilities where appropriate.

---

# 5. The Assistant Must Understand Home Asset Manager

This must NOT be a generic chatbot.

The assistant should understand the application's domain.

It should be able to answer questions such as:

### Assets

"Show me all my assets."

"How many appliances do I have?"

"Tell me about my washing machine."

"What TV do I own?"

"Which assets are in my garage?"

"What did I buy in 2025?"

"Which asset was the most expensive?"

---

### Warranty

"Which appliances are still under warranty?"

"Which warranties expire this month?"

"Does my washing machine still have warranty?"

"When does my TV warranty expire?"

"Show me assets with expired warranties."

---

### Maintenance

"What needs maintenance?"

"When was my AC last serviced?"

"When is my next AC service?"

"Which appliances haven't been serviced recently?"

"How much did I spend on maintenance this year?"

---

### Documents

"Where is my TV invoice?"

"Do I have the warranty document for my washing machine?"

"Show me assets without invoices."

"Which documents belong to my refrigerator?"

---

### Reminders

"What reminders do I have?"

"What is due this week?"

"Create a reminder to service my AC next month."

"Remind me to replace the RO filter in 30 days."

---

### Household

"Who has access to my household?"

"Which assets belong to my father?"

"Show me shared assets."

---

# 6. Conversational Context

The assistant must maintain context within the conversation.

Example:

User:

> "Tell me about my washing machine."

AI:

> "Your Bosch washing machine was purchased on August 12, 2025 for ₹38,999. The warranty is active."

User:

> "When does it expire?"

The assistant must understand that "it" refers to the washing machine warranty.

Another example:

User:

> "Show me my appliances."

AI lists the appliances.

User:

> "Which one is the oldest?"

The assistant should use the previous context and determine the oldest appliance.

However, NEVER rely only on natural-language context for authorization.

Internally use stable IDs whenever possible.

---

# 7. AI Tool Architecture

The AI must NOT directly access PostgreSQL.

The AI must NOT execute arbitrary SQL.

The AI must NOT bypass the existing backend.

Use:

```text
Gemini
   ↓
Tool Call
   ↓
Backend Tool Handler
   ↓
Authorization
   ↓
Existing Service/API
   ↓
Database
```

The backend remains responsible for:

- Authentication
- Authorization
- Validation
- Business rules
- Database access
- Mutation safety

---

# 8. Tools

Inspect the existing backend before creating tools.

Do not blindly create duplicate APIs.

Create a thin AI tool layer that maps to existing application services wherever possible.

Potential tools:

## Asset tools

```text
search_assets
get_asset
list_assets
```

Potentially:

```text
create_asset
update_asset
```

only if the existing application supports these operations cleanly.

---

## Warranty tools

```text
get_asset_warranty
list_expiring_warranties
list_expired_warranties
```

---

## Maintenance tools

```text
get_maintenance_history
get_upcoming_maintenance
get_maintenance_due
```

---

## Reminder tools

```text
list_reminders
create_reminder
update_reminder
complete_reminder
```

---

## Document tools

```text
search_documents
get_asset_documents
```

Do not expose unrestricted file-system or storage access to the AI.

---

## Household tools

Only if supported by the existing application:

```text
get_household
list_household_members
```

---

# 9. Tool Design Rules

Every tool should have:

- Clear name
- Description
- Strict parameter schema
- Validation
- Authorization
- Error handling
- Safe response format

Example:

```typescript
search_assets({
  query: string,
  category?: string,
  location?: string
})
```

The tool should return structured information.

Example:

```json
{
  "assets": [
    {
      "id": "asset_123",
      "name": "Bosch Washing Machine",
      "brand": "Bosch",
      "model": "XYZ",
      "purchaseDate": "2025-08-12",
      "purchasePrice": 38999,
      "warrantyEnd": "2027-08-11"
    }
  ]
}
```

Do not return unnecessary sensitive data.

---

# 10. Read Operations First

The first implementation milestone should contain ONLY read-oriented tools.

For example:

```text
search assets
get asset
get warranty
get maintenance history
get reminders
search documents
```

The first working flow should be:

```text
User:
"Tell me about my washing machine."

        ↓

Gemini understands request

        ↓

search_assets()

        ↓

Backend validates authenticated user

        ↓

Existing Asset Service

        ↓

PostgreSQL

        ↓

Asset returned

        ↓

Gemini generates response

        ↓

AI speaks
```

Get this working reliably before implementing mutations.

---

# 11. Write Operations

After read operations work, add safe mutations.

Examples:

```text
create_reminder
update_reminder
complete_reminder
```

Potentially:

```text
create_asset
update_asset
```

Only if the existing backend supports them.

---

# 12. Confirmation for Dangerous Actions

The AI must never blindly perform destructive operations.

For example:

User:

> "Delete my washing machine."

AI:

> "I found your Bosch washing machine. Deleting it will permanently remove the asset record. Do you want me to continue?"

Only after explicit confirmation:

```text
delete_asset(assetId)
```

Similarly, if an action can cause significant consequences, confirmation should be required.

The LLM should NOT be the final authorization layer.

---

# 13. Authentication and Authorization

This is critical.

The AI assistant must operate as the currently authenticated user.

If:

```text
User A
```

is logged in, the assistant can ONLY access data that User A is authorized to access.

For household sharing, respect existing roles:

```text
Owner
Admin
Member
```

The AI must respect the same permission model as the normal application.

Never trust:

```text
assetId
householdId
userId
```

coming from the model alone.

Resolve and validate authorization on the server.

---

# 14. Gemini Integration

I want to use **Google Gemini's realtime/live voice capabilities**.

Before implementing:

1. Check the current Gemini documentation/API.
2. Determine the correct current SDK.
3. Determine whether browser-side realtime connection is appropriate.
4. Determine which credentials may safely exist in the browser.
5. Keep private API credentials on the server.
6. Use ephemeral/session credentials if supported and appropriate.
7. Use the current recommended realtime architecture rather than an outdated API.

Do not assume an old Gemini SDK or deprecated API.

If there are multiple valid architectures, explain which one you selected and why.

---

# 15. Client vs Server Responsibilities

Clearly separate responsibilities.

## Browser

Responsible for:

- Microphone access
- Voice UI
- Realtime audio connection
- Conversation display
- Connection state
- User interaction
- Interruptions
- Playing AI audio

## Server

Responsible for:

- Authentication
- Authorization
- AI session setup where required
- Tool execution
- Business logic
- Existing API/service calls
- Sensitive credentials
- Logging
- Rate limiting

## Gemini

Responsible for:

- Speech understanding
- Natural-language reasoning
- Conversation
- Tool selection
- Voice response

Gemini must NOT become the database.

---

# 16. Voice UX States

The UI should clearly show:

```text
Disconnected
Connecting
Listening
Thinking
Speaking
Interrupted
Error
```

The user should always know what the assistant is doing.

Example:

```text
● Listening
● Thinking
● Speaking
```

Use animation subtly.

Do not make it look like a generic AI demo.

Reuse the existing Home Asset Manager design system.

---

# 17. Interruptions / Barge-In

The assistant should support natural interruption.

Example:

AI:

> "Your washing machine warranty expires on—"

User:

> "Wait, what about my refrigerator?"

AI should stop speaking and process the new request.

Do not require the user to press stop every time.

If Gemini's realtime API supports native interruption handling, use it.

---

# 18. Text Fallback

Design the assistant architecture so that text input can be supported later.

The core architecture should be:

```text
             AI Agent
                │
        ┌───────┴───────┐
        ▼               ▼
      Voice            Text
        │               │
        └───────┬───────┘
                ▼
              Tools
                │
                ▼
          Existing Backend
```

Voice should be an interface to the agent, not the agent itself.

---

# 19. Conversation History

For the MVP:

Determine whether conversation history needs to be persisted.

Prefer keeping the initial implementation session-based unless persistent history provides clear product value.

If persistence is introduced:

Consider a model such as:

```text
AIConversation
AIMessage
AIToolCall
```

But DO NOT add database tables unless they are actually necessary.

---

# 20. Observability

For development, log:

```text
conversation started
conversation ended
tool called
tool arguments
tool result status
tool execution duration
AI errors
connection errors
```

Be careful with personal data.

Do not log:

- Full documents
- Private document contents
- Authentication tokens
- API keys
- Sensitive household information unnecessarily

---

# 21. Error Handling

The assistant must gracefully handle:

### Gemini unavailable

> "I'm having trouble connecting right now. Please try again."

### Tool failure

> "I couldn't retrieve your asset information right now."

### Asset not found

> "I couldn't find an asset matching that description."

### Ambiguous request

User:

> "What's my warranty?"

AI should ask:

> "Which asset are you asking about?"

Do not randomly choose an asset.

---

# 22. Hallucination Prevention

This is extremely important.

The assistant must never invent:

- Asset information
- Purchase prices
- Warranty dates
- Serial numbers
- Maintenance records
- Documents
- Reminders

If the backend doesn't return the information:

Say that the information isn't available.

For example:

Backend:

```json
{
  "warranty": null
}
```

AI should say:

> "I don't have warranty information recorded for that asset."

NOT:

> "Your warranty expired last year."

---

# 23. UI Integration

Inspect the existing web application and determine the best location for the assistant.

Prefer something like:

```text
Home Asset Manager
────────────────────────

Dashboard

Assets

Reminders

Documents

...

                     ┌─────┐
                     │ 🎙️  │
                     └─────┘
```

Clicking the assistant should open a compact voice interface.

On desktop:

- Floating assistant panel

On mobile web/PWA:

- Bottom sheet / full-screen assistant

Use existing UI primitives.

Do not introduce a completely unrelated design language.

---

# 24. Context-Aware UI Actions

Where useful, the assistant should understand the current page.

Example:

User is viewing:

```text
Samsung 55" OLED TV
```

Then opens assistant and asks:

> "When does its warranty expire?"

The assistant should be able to understand that the current page's asset is relevant.

However, the server must still validate access to that asset.

Potential context:

```json
{
  "currentRoute": "/assets/asset_123",
  "currentAssetId": "asset_123"
}
```

Treat this as contextual information, NOT authorization.

---

# 25. Future Capabilities

Design the architecture so these can eventually be added:

### Voice asset creation

User:

> "I bought a new Samsung TV for ₹69,999 from Croma yesterday."

Assistant:

> "I can add that. Do you want to create this asset?"

Then structured asset creation.

---

### Invoice assistant

User:

> "Add this invoice to my washing machine."

Assistant identifies the current asset and attaches the document through approved backend functionality.

---

### Maintenance assistant

User:

> "My AC was serviced today for ₹2,500 by ABC Services."

Assistant:

> "Should I record this as an AC service?"

---

### Proactive intelligence

Eventually:

> "You have three things that need attention this week: your AC service is due, your TV warranty expires soon, and your washing machine has no invoice attached."

Do NOT implement proactive AI notifications in the first iteration unless the existing architecture already supports it cleanly.

---

# 26. Do Not Break Existing Invoice AI

The current product already uses AI for invoice extraction.

Do not replace or interfere with the existing invoice extraction pipeline.

The voice assistant should coexist with:

```text
Invoice Image
↓
Gemini multimodal extraction
↓
Structured data
↓
Review
↓
Asset creation
```

The voice assistant is a separate capability.

---

# 27. Security Requirements

Follow the existing application's security model.

Important:

- Authentication required
- Household-level authorization
- Asset-level authorization
- Document access protection
- Private document URLs
- No direct DB access from Gemini
- No arbitrary code execution
- No arbitrary SQL
- Strict tool schemas
- Server-side validation
- Rate limiting
- Audit logging for mutations
- No API keys exposed unnecessarily

The AI should be treated as an **untrusted caller of backend tools**.

---

# 28. Development Approach

Implement incrementally.

## Phase 0 — Repository Analysis

Inspect the existing monorepo.

Output:

- Architecture
- Relevant files
- Existing services
- Existing APIs
- Existing auth
- Existing database models
- Recommended integration points

DO NOT modify code yet.

---

## Phase 1 — Voice UI

Create the assistant UI.

Implement:

- Open/close
- Microphone permission
- Listening state
- Speaking state
- Error state
- Connection state

Use mocked responses initially if necessary.

---

## Phase 2 — Gemini Realtime Connection

Connect the browser to the current recommended Gemini realtime/live voice API.

Test:

```text
User speaks
↓
Gemini receives audio
↓
Gemini responds
↓
User hears response
```

At this stage the assistant does not need Home Asset Manager tools.

---

## Phase 3 — Agent Tools

Add the first read-only tools:

```text
search_assets
get_asset
get_asset_warranty
get_upcoming_maintenance
list_reminders
search_documents
```

Connect them to the existing backend.

---

## Phase 4 — Real Home Asset Manager Questions

Test:

> "How many assets do I have?"

> "Tell me about my washing machine."

> "Which warranties expire next month?"

> "What needs attention?"

> "When was my AC last serviced?"

---

## Phase 5 — Safe Mutations

Add:

```text
create_reminder
update_reminder
complete_reminder
```

with confirmation where appropriate.

---

## Phase 6 — Context

Add:

- Conversation context
- Current-page context
- Asset context

---

## Phase 7 — Hardening

Add:

- Security tests
- Authorization tests
- Tool validation
- Error handling
- Reconnection
- Rate limiting
- Logging
- Performance testing
- Voice interruption testing

---

# 29. Testing Scenarios

Create tests for:

### Basic

```text
"Show my assets."
"Tell me about my TV."
```

### Context

```text
"Tell me about my washing machine."
"When did I buy it?"
"Is it still under warranty?"
```

### Ambiguous

```text
"What's my warranty?"
```

Assistant should ask which asset.

### Missing data

Asset exists but warranty is missing.

Assistant should say it has no warranty information.

### Authorization

Try asking about an asset belonging to another household.

Assistant must refuse/not expose the information.

### Mutation

```text
"Create a reminder to service my AC next month."
```

Verify the backend actually creates it.

### Destructive

```text
"Delete my TV."
```

Assistant must request confirmation before deletion.

### Interruption

Interrupt AI while it is speaking.

### Connection failure

Disconnect network during a conversation.

### Gemini failure

Simulate API failure.

---

# 30. Performance Goals

The assistant should feel realtime.

Minimize:

- Audio latency
- Tool execution latency
- Backend round trips
- Unnecessary model calls

Use streaming wherever supported.

Measure:

```text
Voice input → AI response
Tool call → tool result
Tool result → spoken response
```

---

# 31. Environment Variables

Inspect the existing environment configuration.

Add only the required Gemini configuration.

Never commit secrets.

Clearly document:

```text
Required environment variables
Development values
Production values
Which variables are server-only
Which values can safely reach the browser
```

If ephemeral credentials/session tokens are required, implement the recommended secure mechanism.

---

# 32. Code Quality

Follow the existing project's conventions.

Use:

- Existing TypeScript configuration
- Existing linting
- Existing formatting
- Existing naming conventions
- Existing API patterns
- Existing error handling
- Existing validation library
- Existing database/service patterns

Avoid unnecessary dependencies.

Before adding a dependency, check whether the repository already has an equivalent.

---

# 33. Final Deliverables

After analysis, provide:

## Architecture

```text
Browser
 ↓
Gemini Realtime Voice
 ↓
AI Tool Layer
 ↓
Backend
 ↓
Existing Services
 ↓
PostgreSQL
```

Explain every component.

## Files

List:

```text
Files to modify
Files to create
Files not to touch
```

## Tools

Provide complete tool definitions.

## Security

Explain authentication and authorization flow.

## Data flow

Explain a complete example:

```text
User:
"When does my washing machine warranty expire?"
```

all the way through:

```text
Microphone
→ Gemini
→ Tool call
→ Backend
→ Auth
→ Asset service
→ DB
→ Tool result
→ Gemini
→ Voice response
```

## Implementation

Then implement the feature incrementally.

---

# 34. Most Important Requirement

Do not build this as:

```text
Voice chatbot
```

Build it as:

```text
Home Asset Manager
        +
Natural Language Interface
        +
Realtime Voice
        +
Secure Tool Calling
```

The existing Home Asset Manager backend remains the source of truth.

The AI is an intelligent interface over the product.

The final experience should feel like:

> **"Ask your Home Asset Manager anything about the things you own."**

Examples:

> "What needs attention?"

> "Which warranties expire soon?"

> "Where's my TV invoice?"

> "When was my AC serviced?"

> "How much did I spend on maintenance?"

> "Show me everything in my garage."

> "Create a reminder to service the washing machine next month."

The assistant should make the existing Home Asset Manager dramatically easier to use without replacing its existing workflows.