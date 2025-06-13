# Italian Traffic Violations: Combinatorial Template System

## Discovery Summary

The Italian traffic violations system is brilliantly engineered using a **combinatorial template approach** that avoids text duplication while handling immense legal complexity.

## How It Works

### 1. Base Violation Template
- Generic text with placeholders (`...`) for variable content
- Multiple choice options marked with bullets (`•`)
- Cross-references to numbered notes: `(v. nota X)`
- Typically 500-2000 characters

### 2. Numbered Notes System
Notes are NOT supplementary - they ARE the violation content:
- **Dottrinali (Doctrinal)**: Legal procedures and officer instructions
- **Informative**: Calendars, exemptions, special cases, detailed regulations

### 3. Combinatorial Generation
One violation template + notes can generate thousands of specific cases:
- Different vehicle types (>7.5t, <7.5t)
- Different days (weekdays, weekends, holidays)
- Different cargo types (perishable, dangerous, etc.)
- Different exemptions (emergency vehicles, utilities, etc.)

## Real Example: Violation 006-02

**Title**: "Inosservanza sospensione circolazione fuori centri abitati con veicoli per trasporto cose"

**Structure**:
- Base verbale: 1,016 characters (template)
- Notes: 70,000+ characters containing:
  - Note 9: Complete 2025 calendar with specific dates/hours
  - Notes 10-13: All possible exemptions and derogations
  - Note 14: Special rules for dangerous goods

**The Genius**: Instead of creating thousands of separate violations, one template + notes covers ALL cases.

## Implications for AI/Search

1. **Indexing Strategy**
   - MUST index violations as "super-documents" (base + ALL notes)
   - Cannot treat notes as metadata - they're the core content

2. **Search Requirements**
   - Must search across both base text AND notes
   - Example query: "camion 8 tonnellate domenica" must match Note 9's calendar

3. **Embedding Generation**
   - Need to embed the complete document, not just base text
   - Consider chunking strategies for 70KB+ documents

4. **User Experience**
   - Show base violation for context
   - Highlight relevant notes based on query
   - Allow navigation through note cross-references

## Technical Challenges

1. **Document Size**: Some violations exceed 100KB with all notes
2. **Cross-References**: Need to resolve "(v. nota X)" references
3. **Context Window**: LLMs need full context to understand violations
4. **Search Precision**: Must find specific rules within massive notes

## Solution Approach

1. Create composite documents: base + all notes
2. Generate embeddings for semantic search
3. Use structured extraction for calendars, vehicle types, etc.
4. Implement hybrid search: semantic + keyword + filters
5. Build UI that shows relevant sections highlighted