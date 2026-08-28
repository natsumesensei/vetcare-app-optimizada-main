-- =================================================================
-- VETCARE CLINICAL MANAGEMENT - POSTGRESQL PRODUCTION SCHEMA
-- =================================================================

-- 1. USUARIOS Y AUTENTICACIÓN
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'veterinario', -- admin, veterinario, recepcionista
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROPIETARIOS / CLIENTES
CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dni_rnc VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PACIENTES
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL, -- Canino, Felino, Exótico, etc.
    breed VARCHAR(100),
    sex VARCHAR(20),
    birthdate DATE,
    weight DECIMAL(6,2),
    color VARCHAR(100),
    microchip VARCHAR(100),
    allergies TEXT,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_owner ON patients(owner_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- 4. CITAS
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    veterinarian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    type VARCHAR(100) DEFAULT 'consulta', -- consulta, cirugia, vacunacion, revision, etc.
    status VARCHAR(50) DEFAULT 'pendiente', -- pendiente, confirmada, atendida, cancelada
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appts_date ON appointments(appointment_date);

-- 5. CONSULTAS CLÍNICAS
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    veterinarian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    consultation_date DATE NOT NULL,
    reason TEXT,
    symptoms TEXT,
    temperature DECIMAL(4,1),
    weight DECIMAL(6,2),
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consults_patient ON consultations(patient_id);

-- 6. VACUNACIÓN Y DESPARASITACIÓN
CREATE TABLE IF NOT EXISTS vaccines (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    application_date DATE NOT NULL,
    next_due_date DATE,
    batch_number VARCHAR(100),
    administered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parasites (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'interno', -- interno, externo, ambos
    application_date DATE NOT NULL,
    next_due_date DATE,
    administered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. HOSPITALIZACIÓN Y CIRUGÍAS
CREATE TABLE IF NOT EXISTS hospitalizations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    admission_date DATE NOT NULL,
    discharge_date DATE,
    cage_box VARCHAR(100),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'activo', -- activo, dado_alta, derivado
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surgeries (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    surgery_name VARCHAR(255) NOT NULL,
    surgery_date DATE NOT NULL,
    surgeon_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    anesthesia_protocol TEXT,
    status VARCHAR(50) DEFAULT 'programada', -- programada, realizada, cancelada
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. INVENTARIO / PRODUCTOS / SERVICIOS
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'producto', -- producto, servicio, medicamento, vacuna
    category VARCHAR(100),
    sku VARCHAR(100),
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 5,
    unit VARCHAR(50) DEFAULT 'unidad',
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. FACTURACIÓN PROFESIONAL MULTIDIVISA
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(10) DEFAULT 'EUR', -- EUR, USD, DOP
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'efectivo', -- efectivo, tarjeta, transferencia, etc.
    status VARCHAR(50) DEFAULT 'pagada', -- pendiente, pagada, anulada
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) DEFAULT 'servicio', -- producto, servicio
    item_id INTEGER,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(5,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- 10. LABORATORIO CLÍNICO VETERINARIO REAL
CREATE TABLE IF NOT EXISTS lab_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    veterinarian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_date DATE NOT NULL,
    panel VARCHAR(100) DEFAULT 'Hemograma Completo',
    sample_type VARCHAR(100) DEFAULT 'Sangre entera EDTA',
    indications TEXT,
    status VARCHAR(50) DEFAULT 'completada', -- pendiente, en_proceso, completada, cancelada
    conclusions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Hematología',
    result_value DECIMAL(10,2),
    result_text VARCHAR(255),
    unit VARCHAR(50),
    reference_min DECIMAL(10,2),
    reference_max DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Normal' -- Normal, Bajo, Alto, Crítico
);

CREATE TABLE IF NOT EXISTS lab_reference_values (
    id SERIAL PRIMARY KEY,
    species VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    active INTEGER DEFAULT 1
);

-- 11. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
