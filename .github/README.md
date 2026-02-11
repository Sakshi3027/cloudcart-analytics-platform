# GitHub Actions Workflows

## CI/CD Pipeline Status

![Test Services](https://github.com/Sakshi3027/cloudcart-analytics-platform/actions/workflows/test.yml/badge.svg)
![Build & Security](https://github.com/Sakshi3027/cloudcart-analytics-platform/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Sakshi3027/cloudcart-analytics-platform/actions/workflows/codeql.yml/badge.svg)

## Workflows

### 1. Test Services (`test.yml`)
- Runs on every push and PR
- Tests all microservices
- Checks code quality
- Node.js and Python testing

### 2. Build & Security Scan (`build.yml`)
- Builds Docker images
- Scans for vulnerabilities with Trivy
- Uploads security findings to GitHub Security

### 3. CodeQL Analysis (`codeql.yml`)
- Advanced security analysis
- Runs weekly and on every PR
- JavaScript and Python scanning

### 4. Dependency Review (`dependency-review.yml`)
- Reviews dependencies on PRs
- Checks for known vulnerabilities
- Comments findings directly on PRs

### 5. PR Labeler (`labeler.yml`)
- Automatically labels PRs based on changed files
- Helps organize and categorize changes
