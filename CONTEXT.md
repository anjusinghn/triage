# ATS screening

Triage screens a PDF resume against a target position and ranks the person for that requisition.

## Language

**Target position**:
The job requisition used as the scoring benchmark. Exactly one is selected for a review run.
_Avoid_: Role, agent, listing

**Candidate**:
The person inferred from a resume. One candidate can be scored against many target positions.
_Avoid_: Applicant as the person record (that is an Application), profile

**Parsed resume**:
The extracted text and structured parse of one resume file, identified by the file’s content hash. Job-agnostic.
_Avoid_: Resume file, CV upload, candidate (the person), application (the score)

**Application**:
The score and recommendation of one candidate for one target position.
_Avoid_: Review session, match, parsed resume
