# Deployment Configuration

## GitHub Actions CI/CD Pipeline

This repository uses GitHub Actions for automated testing and Vercel deployment.

### Required GitHub Secrets

To configure the deployment pipeline, add these secrets to your GitHub repository:

**Go to:** Settings → Secrets and variables → Actions → New repository secret

#### 1. VERCEL_TOKEN
- **Value**: Your Vercel API token
- **Get it from**: https://vercel.com/account/tokens
- **Purpose**: Allows GitHub Actions to deploy to Vercel

#### 2. VERCEL_ORG_ID  
- **Value**: Your Vercel organization/team ID
- **Get it from**: 
  ```bash
  vercel link
  # Then check .vercel/project.json for "orgId"
  ```
- **Purpose**: Identifies your Vercel organization

#### 3. VERCEL_PROJECT_ID
- **Value**: Your Vercel project ID  
- **Get it from**:
  ```bash
  vercel link
  # Then check .vercel/project.json for "projectId"
  ```
- **Purpose**: Identifies your specific project

### Getting Vercel IDs

1. Run `vercel link` in your project root
2. Follow the prompts to link your project
3. Check `.vercel/project.json` for the IDs:
   ```json
   {
     "orgId": "your-org-id-here",
     "projectId": "your-project-id-here"
   }
   ```

### Workflow Behavior

- **Pull Requests**: Deploys preview environments
- **Main Branch**: Deploys to production after CI passes
- **CI Steps**: Install → Lint → Build → Test → Deploy

### Manual Deployment

If you need to deploy manually:
```bash
vercel --prod  # Production deployment
vercel         # Preview deployment
```