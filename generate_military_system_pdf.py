from pathlib import Path

OUTPUT_PATH = Path(r"C:\Users\Rushikesh Avachat\Desktop\bacup\Desktop\military-system\military-system-project-document.pdf")

TEXT = """Military Asset Management System
Project Documentation

1. Project Overview
The Military Asset Management System is a modular operations dashboard designed to help command, logistics, and base-level personnel monitor, assign, transfer, and expend critical military assets across multiple bases. The initial framework focuses on core operational transparency and accountability rather than a full production-grade enterprise platform.

Assumptions
- Assets tracked include vehicles, weapons, ammunition, and other equipment categories.
- The system is intended for command-level oversight and operational planning across a small-to-medium multi-base environment.
- Data can be seeded and used for demonstration and continuing development.

Limitations
- The current implementation is an initial framework and not a fully hardened production enterprise solution.
- Authentication is demonstration-oriented rather than a full JWT/OAuth system.
- Role enforcement relies on request headers in the backend and does not yet include MFA or secure session management.
- Database connectivity must be configured in the backend environment for live operational use.

2. Tech Stack and Architecture
Backend: Node.js + Express
- REST API layer for the dashboard, purchases, transfers, assignments, and expenditures.
- Middleware-based RBAC enforcement.
- Audit logging for operational accountability.

Frontend: React + Vite
- Fast UI development environment with dashboard-driven views.
- Pages for dashboard, purchases, transfers, assignments, and inventory tracking.
- Fetches data from the backend API using a shared API URL helper.

Database: PostgreSQL + Drizzle ORM
- Core tables provide structured relational storage for bases, inventory, transfers, and assignments.
- Drizzle ORM supports schema-driven development and database query management.
- PostgreSQL is suitable for transactional operations, role-aware reporting, and audit retention.

Architecture
- Frontend requests are sent to http://localhost:5000/api.
- Backend validates role and base access for each route.
- When the database is valid and connected, data is read from the database; otherwise, fallback demo data is returned.

3. Data Models and Schema
Core entities and relationships:
- bases: id, name, commander, created_at
- equipment_types: id, name, created_at
- inventory: id, base_id, equipment_type_id, opening_balance, closing_balance, quantity_on_hand, assigned_quantity, expended_quantity, updated_at
- purchases: id, base_id, equipment_type_id, quantity, unit_cost, purchase_date, created_at
- transfers: id, from_base_id, to_base_id, equipment_type_id, quantity, transfer_date, created_at
- assignments: id, base_id, equipment_type_id, asset_name, assigned_to, quantity, assigned_at
- expenditures: id, base_id, equipment_type_id, asset_name, quantity, expenditure_date, created_at
- audit_logs: id, table_name, action, actor_role, details, created_at
- users: id, name, username, role, assigned_base_id, active, created_at

Relationships
- Inventory belongs to a base and equipment type.
- Purchases belong to a base and equipment type.
- Transfers move equipment between two bases.
- Assignments associate assets with personnel by base.
- Expenditures record operational usage.
- Audit logs capture operational actions by role.

4. RBAC Explanation
Roles defined in the current implementation:
- Admin: full access to all data and operations.
- Base Commander: access to data and operations for their assigned base.
- Logistics Officer: access to purchases and transfers.

Enforcement method
- Route middleware checks the x-user-role request header.
- authorize(allowedRoles) validates the caller's role against a route's list.
- requireBaseAccess checks that base-scoped operations are allowed.
- A role hierarchy is implemented to support level-based privilege checks.

Example demo role values:
- admin
- base_commander
- logistics_officer

Notes
- This is a demonstration RBAC model and should be upgraded to a real authentication service for production.
- The system does not currently expose a secure login page; it uses mocked role headers to simulate different access levels.

5. API Logging
Transaction and activity logging is handled through the backend audit_logs table and audit middleware logic.

What is logged
- table_name: the target table
- action: create/view/update-style operation
- actor_role: role of the acting user
- details: JSON payload with context
- created_at: timestamp of record creation

Current behavior
- API routes log activity when records are requested or created.
- This supports transparency, auditability, and operational accountability.
- Logs are retained for review and reporting.

6. Setup Instructions
Prerequisites
- Node.js 18+
- PostgreSQL database or configured database backend
- npm package manager

Backend setup
1. Open the backend folder.
2. Install dependencies with npm install.
3. Configure the database environment variables in .env.
4. Start the backend using npm run start.

Frontend setup
1. Open the frontend folder.
2. Install dependencies with npm install.
3. Start the Vite app with npm run dev.
4. Open the app at http://localhost:5173.

Environment note
- The frontend expects the backend API at http://localhost:5000/api unless a different VITE_API_BASE_URL is configured.

7. API Endpoints
Key endpoints defined in the backend:
- GET /api/health
- GET /api/dashboard
- GET /api/purchases
- POST /api/purchases
- GET /api/transfers
- POST /api/transfers
- GET /api/assignments
- POST /api/assignments
- GET /api/expenditures
- POST /api/expenditures
- GET /api/audit-logs

Response format
- Most routes return JSON with a top-level data array, or a success message payload.
- Example: { data: [ ... ] }

8. Login Credentials
Current implementation note
- The codebase does not yet include a production authentication system with a real username/password login screen.
- For demo and testing, role access is simulated using the x-user-role header.

Demo login / access values
- Username: admin
  Password: admin
  Role: admin
- Username: base_commander
  Password: base_commander
  Role: base_commander
- Username: logistics_officer
  Password: logistics_officer
  Role: logistics_officer

These values are intended for demonstration and should be replaced by a secure authentication flow in a production deployment.

Summary
This project establishes the initial framework for a military logistics and accountability dashboard. It includes role-aware API access, inventory and movement tracking, assignments, expenditures, and an operational audit trail. The system is a strong starting point for a secure, production-ready Military Asset Management System.
"""


def sanitize_line(line: str) -> str:
    replace_map = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
    }
    for src, dst in replace_map.items():
        line = line.replace(src, dst)
    return line.encode('latin-1', 'replace').decode('latin-1')


def wrap_text(text: str, width: int = 90):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if not current:
            current = word
        elif len(current) + 1 + len(word) <= width:
            current += " " + word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def escape_pdf_text(value: str) -> str:
    value = value.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
    return value


formatted_lines = []
for block in TEXT.strip().split('\n\n'):
    for raw_line in block.split('\n'):
        line = sanitize_line(raw_line.strip())
        if not line:
            continue
        if line.startswith('- ') or line.startswith('1.') or line.startswith('2.') or line.startswith('3.') or line.startswith('4.') or line.startswith('5.') or line.startswith('6.') or line.startswith('7.') or line.startswith('8.'):
            formatted_lines.append(line)
        else:
            formatted_lines.extend(wrap_text(line, 90))
    formatted_lines.append('')

content = []
y = 760
for line in formatted_lines:
    if not line:
        y -= 14
        continue
    if len(line) > 90:
        for sub in wrap_text(line, 90):
            content.append(f"BT /F1 10 Tf 50 {y} Td ({escape_pdf_text(sub)}) Tj ET")
            y -= 14
    else:
        content.append(f"BT /F1 10 Tf 50 {y} Td ({escape_pdf_text(line)}) Tj ET")
        y -= 14
    if y < 40:
        break

stream = '\n'.join(content)

pdf = '%PDF-1.4\n'
objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    f'<< /Length {len(stream.encode("latin-1"))} >>\nstream\n{stream}\nendstream'
]

pdf_objects = []
for idx, obj in enumerate(objects, start=1):
    pdf_objects.append(f"{idx} 0 obj\n{obj}\nendobj\n")

pdf += ''.join(pdf_objects)

xref_offset = len(pdf.encode('latin-1'))
# Build xref after all objects
pdf += f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n"
offsets = [0]
cur = 0
for obj in pdf_objects:
    cur = len(pdf.encode('latin-1'))
    offsets.append(cur)
    # The previous line already appended objects, so we need to compute offsets correctly.
    # Rebuild the PDF properly instead of appending incrementally.
    pass

# Rebuild from scratch with exact offsets.
full = '%PDF-1.4\n'
offsets = [0]
for obj in pdf_objects:
    offsets.append(len(full.encode('latin-1')))
    full += obj
xref_pos = len(full.encode('latin-1'))
full += f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n"
for offset in offsets[1:]:
    full += f"{offset:010d} 00000 n \n"
full += f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n"

OUTPUT_PATH.write_bytes(full.encode('latin-1'))
print(f"Created PDF: {OUTPUT_PATH}")
