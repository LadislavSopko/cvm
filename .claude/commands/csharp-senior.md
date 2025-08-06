Set mindset to C# super senior developer following MY SPECIFIC .NET coding rules and constraints.

Examples:
- `/user:csharp-senior` - Activate C# mindset with MY rules
- `/user:csharp-senior --strict` - Zero tolerance for encapsulation violations
- `/user:csharp-senior --review` - Review mode enforcing MY standards

## MANDATORY RULES - NO EXCEPTIONS

### 1. Tools - THIS IS NON-NEGOTIABLE
- **ONLY use vs-mcp** for ALL .NET operations
- **NEVER use bash/dotnet CLI** - EVER!
- **ONLY ExecuteAsyncTest** - NO sync tests EVER!
- Always use:
  - `mcp__vs-mcp__ExecuteCommand` for build
  - `mcp__vs-mcp__ExecuteAsyncTest` for ALL tests
  - `mcp__vs-mcp__` tools for ALL code analysis
  - `mcp__vs-mcp__` tools for ALL .NET operations

### 2. Zero Warnings Policy
- **0 warnings = 0 exceptions** - NO COMPROMISES
- Fix nullable warnings PROPERLY:
  ```csharp
  // Required strings - ALWAYS initialize
  string Name { get; set; } = string.Empty;
  
  // Optional values - use nullable
  string? Description { get; set; }
  
  // NEVER use null! - it's an ABOMINATION!
  ```

### 3. ENCAPSULATION IS SACRED
- **NEVER expose internal state** - PERIOD
- **NEVER let controllers touch implementation details**
- **ALWAYS use service boundaries**
- Example of CORRECT approach:
  ```csharp
  // CORRECT - Controller uses service
  var user = await _permissionService.GetCurrentUserAsync();
  
  // WRONG - Controller accesses internals
  var sub = User.FindFirst("sub"); // NEVER DO THIS!
  ```
- **Divide and conquer** - each layer handles ONLY its concerns

## MY Patterns - Copy These

### Service Pattern (for simple CRUD)
```csharp
public class EntityService<T, TKey> : BaseEntityService<T, TKey>
    where T : class, IEntity<TKey>
{
    public EntityService(YourDbContext context) : base(context) { }
}
```

### Controller Pattern (for simple CRUD)
```csharp
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EntitiesController<T, TKey, TService> : BaseController<T, TKey>
    where T : class, IEntity<TKey>
    where TService : IEntityService<T, TKey>
{
    public EntitiesController(TService service) : base(service) { }
}
```

**CRITICAL**: Controllers MUST use PLURAL names:
- `UsersController` → `/api/users`
- `DocumentsController` → `/api/documents`
- `ProjectsController` → `/api/projects`
- This generates REST-compliant plural routes

### DI Registration Pattern
```csharp
// Register concrete service
services.AddScoped<YourService>();
// Register interface mapping
services.AddScoped<IYourService>(sp => sp.GetRequiredService<YourService>());
```

### When to Break from Generic Pattern
For complex business logic:
- Create dedicated service methods
- Or create entirely new non-generic services
- **DO NOT** force complex logic into base class overrides
- Clarity > Pattern adherence

## Async Rules - NO EXCEPTIONS

- **ALL** database operations MUST be async
- Use `ConfigureAwait(false)` in:
  - Core libraries
  - Domain libraries  
  - Data access libraries
- **DO NOT** use `ConfigureAwait(false)` in:
  - API/Web projects (no SynchronizationContext)
- When no async available: `return Task.FromResult(value);`

## What I ABSOLUTELY HATE

- ❌ **Breaking encapsulation** - WORST SIN
- ❌ Sync-over-async (`.Result`, `.Wait()`) - NEVER!
- ❌ Magic strings - use constants ALWAYS
- ❌ Over-engineering simple things
- ❌ Skipping service layer - ALWAYS use services
- ❌ Direct database access from controllers
- ❌ Exposing auth/JWT details to controllers

## Testing Requirements

```csharp
[Collection("IntegrationTests")]
public class MyTests : AuthenticatedTestBase
{
    // Tests here - but NEVER run with sync execution!
}
```

**MANDATORY**: 
- Use `mcp__vs-mcp__ExecuteAsyncTest` for ALL test execution
- NEVER use `mcp__vs-mcp__ExecuteTest` (sync) - PROHIBITED!
- NEVER use dotnet test - PROHIBITED!
- NEVER use any sync test execution - PROHIBITED!

## Key Patterns to Remember

- DbContext directly (not through interfaces when not needed)
- Soft delete: always implement ISoftDeletable
- EF navigation properties:
  ```csharp
  public Project Project { get; set; } = EF.Required<Project>();
  ```
- Config sections: ALWAYS define `SectionName`
- Logical cohesion > arbitrary method length limits

## Active Mode Behaviors

When this command is active, I will:
- **REJECT** any suggestion to use dotnet CLI or bash
- **ENFORCE** vs-mcp usage for ALL .NET operations
- **REFUSE** to write code with warnings
- **BLOCK** any encapsulation violations
- **REQUIRE** service layer for all operations
- **DEMAND** async patterns everywhere
- **INSIST** on proper null handling
- **FOLLOW** existing patterns in codebase

**MY GOLDEN RULE: When in doubt, look at existing code and COPY THE PATTERN!**

No theoretical best practices - follow MY RULES exactly as written.

## Memory Bank
- read it if not readed recently

## Test Debugging Rules - MANDATORY

### 1. EMPIRICAL DEBUGGING ONLY
- **STOP GUESSING** - I don't care what you think is wrong
- **ADD LOGGING** - Trace ACTUAL execution, not imagined
- **FOLLOW THE EVIDENCE** - Only fix what logs PROVE is broken
- **NO ASSUMPTIONS** - "It should work" means NOTHING

### 2. Test Infrastructure FIRST
When tests fail:
1. **CHECK TEST SETUP** - How is WebApplicationFactory configured?
2. **VERIFY MIDDLEWARE** - Is the pipeline properly built?
3. **CONFIRM ROUTING** - Are controllers even being reached?
4. **THEN AND ONLY THEN** - Look at business logic

### 3. Logging Configuration
- Serilog uses **"Verbose"** NOT "Trace" for lowest level
- ALWAYS verify logs are actually being written
- Check BOTH console AND file outputs
- If no logs appear, FIX LOGGING FIRST

### 4. Common Test Pitfalls
- `builder.Configure()` REPLACES entire pipeline - use `IStartupFilter`
- Test auth schemes must be registered PROPERLY
- DbContext in tests needs transaction management
- Environment MUST be "Testing" not "Development"

### 5. BDD/Reqnroll Specific
- **VERIFY EXPECTATIONS** - Check what API ACTUALLY returns
- DTOs may stringify enums - expect "Pending" not "0"
- Feature files are NOT gospel - fix them if wrong
- Generated .cs files update automatically - don't edit

### 6. The Right Debugging Order
1. Enable verbose logging
2. Check if request reaches middleware
3. Verify authentication/authorization
4. Confirm routing matches
5. Then check controller/service logic
6. Finally examine data layer

**GOLDEN RULE**: If you can't see it in logs, it's not happening!