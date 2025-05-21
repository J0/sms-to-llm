# Product Requirements Document (PRD)

## Project Title

**SMS-to-LLM Gateway for Rural Rwanda**

## Purpose

Enable users in rural Rwanda to access AI via SMS on basic feature phones without mobile internet, using an LLM to answer questions and assist with general knowledge and everyday inquiries.

## Problem Statement

Many users in rural Rwanda do not have smartphones or internet access but do have SMS-capable phones. There is a need to bridge this gap by enabling AI access through SMS.

## Goals

* ✅ Provide a seamless SMS interface to an LLM backend.
* ✅ Ensure responses are concise, mobile-friendly, and formatted for SMS delivery.
* Allow users to continue conversations via SMS with retained context for a limited time.

## Technical Architecture

### Flow

1. ✅ User sends SMS → Received via **Android forwarding app**.
2. ✅ Android app forwards message to **Supabase Edge Function** webhook.
3. ✅ Message sent to **Gemini API** with system prompt for SMS-optimized responses.
4. ✅ Response is sent back via **Android SMS Gateway API**.
5. ✅ Message, response, and context are stored in **Supabase PostgreSQL** database.

### Key Technologies

* ✅ **Android forwarding app** (SMS gateway and delivery)
* ✅ **Supabase Edge Functions** (Message ingestion and routing)
* ✅ **Gemini API** (LLM response generation)
* ✅ **PostgreSQL (via Supabase)** (Message and user state persistence)

## Functional Requirements

### SMS Interaction

* ✅ Responses must not exceed **3 SMS messages** (max 420 characters total).
* ✅ No markdown or rich formatting.
* ✅ Tone should be **helpful and casual**.
* Support for **Kinyarwanda (primary)**, **French**, and **English**.

### User Identification & Session

* ✅ User sessions are identified by **phone number**.
* ✅ Only Rwandan phone numbers (+250) are supported.
* Retain conversation context for **48 hours** of inactivity.

### Commands

* First-time users receive a **welcome message** with instructions.
* Users can send `/help` to get usage instructions.
* Unknown or invalid inputs should not break the system.

### Error Handling

* ✅ If LLM call fails, return: "Sorry, there was an error. Please try again later."
* ✅ Log errors with context (phone number, message, timestamp).
* ✅ Database errors are logged to console but don't block message delivery.

## Non-Functional Requirements

* **Privacy**: Ensure stored conversations are **not accessible** externally.
* **Scalability**: Design system with future LLM or tool-switching in mind.
* **Localization**: Support for multiple languages with auto-detection or user preference.

## Future Considerations

* **Tool use / function calling** to integrate local data (e.g., weather, news, market prices).
* **Rate limits** and usage caps (currently out of scope).
* **Monitoring/Dashboard** for admin (currently not required).
