# Shops MVP

## Status

This document defines the future Shops MVP scope. It does not authorize implementing the full product in one task.

## Goal

The first SaaS product on NexoraXS V2 is Shops, aimed at small retail businesses that need a simple internal operating system for store activity.

The MVP should focus on clarity, reliability, and tenant isolation over feature breadth.

## Shops Domain Objective

A workspace should eventually be able to:
- manage basic shop settings
- manage one or more stores
- manage catalog data
- track stock state
- manage customers
- capture sales orders
- review basic operational reports

## Planned MVP Scope

### Foundation Scope

The earliest implementation slices should prepare:
- workspace-aware Shops routing
- Shops access control
- Shops domain schema
- Shops API namespace
- shared Shops navigation shell

### Operational Scope

After the foundation is stable, MVP business capabilities should likely include:
- stores
- categories
- products
- inventory items and stock movements
- customers
- orders and order items

### Reporting Scope

Initial reporting should stay lightweight:
- sales summary
- inventory snapshot
- low-stock indicators later if justified

## Explicit Non-Goals for MVP

- public storefront or e-commerce
- supplier management
- advanced accounting
- loyalty programs
- barcode hardware integrations
- payment gateway integration
- multi-product cross-domain flows

## Data Ownership Rules

Every Shops entity is tenant-owned and must include `workspace_id`.

If stores are added, store-level data still remains workspace-owned first. Store identifiers do not replace `workspace_id`.

## Recommended Delivery Slices

Future work should be split into small tasks such as:
1. backend workspace resolution and membership policies
2. shared frontend auth and workspace shell
3. Shops route shell and access gates
4. first Shops schema slice
5. first Shops read-only API slice
6. first Shops UI slice

Avoid implementing catalog, inventory, customers, and orders together in one change.

## Access Model

Initial role concepts for Shops can remain simple:
- owner
- manager
- staff

The precise permission matrix can evolve later, but authorization must always remain server-side.
