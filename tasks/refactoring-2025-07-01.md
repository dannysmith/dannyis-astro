# Refactoring 2025-07-01

## Major Task List

- [x] Change Blog Posts to Article everywhere
- [x] Set all external links to target="\_blank"
- [x] Reorganise components
- [x] Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [ ] Sort RSS feeds
- [ ] Upgrade Astro
- [ ] Check sitemap, add analytics and google tag manager

## Task 1 - Change Blog Posts to Article everywhere

Done.

## Task 2 - Set all external links to target="\_blank"

Done.

## Task 3 - Reorganise components

Done.

## Task 4 - Check metadata, titles, OG tags, descriptions etc for SEO optimisation

### Current SEO Implementation Analysis

**✅ What's Working Well:**

- BaseHead.astro component properly implements essential meta tags
- Dynamic OpenGraph image generation for articles and notes
- Proper canonical URLs and sitemap configuration
- Mobile-responsive viewport meta tag
- SSL implementation and secure site configuration
- External links properly configured with security attributes
- Schema.org markup for articles with proper structured data

**⚠️ Areas Needing Attention:**

1. **Content-Level Issues:**

   - Many articles lack compelling meta descriptions
   - Some notes have missing titles or descriptions
   - Generic site-wide title/description usage on index pages
   - Inconsistent keyword optimization across content

2. **Technical SEO Gaps:**

   - Missing JSON-LD structured data for enhanced rich snippets
   - No breadcrumb schema markup
   - Limited meta tag optimization for different content types
   - No meta robots tags for content management

3. **SEO Strategy Issues:**
   - No clear keyword strategy for Danny's personal brand
   - Missing focus keywords for different content categories
   - Opportunity to better leverage Danny's expertise areas

### SEO Optimization Plan

#### Phase 1: Content Audit & Strategy (Week 1)

**1.1 Content Meta Data Audit**

- [ ] Audit all articles for missing/poor meta descriptions
- [ ] Identify articles lacking proper title optimization
- [ ] Review notes for missing titles and descriptions
- [ ] Create spreadsheet of content gaps and opportunities

**1.2 Keyword Research & Brand Strategy**

- [ ] Research Danny's core expertise keywords:
  - "Remote work consultant"
  - "Organizational health expert"
  - "Leadership coaching"
  - "Remote team operations"
  - "Business process optimization"
- [ ] Identify long-tail opportunities based on existing content
- [ ] Map keywords to content categories (articles vs notes)
- [ ] Define Danny's unique value propositions for SEO

**1.3 Competitor Analysis**

- [ ] Analyze similar personal brands in Danny's space
- [ ] Review meta title/description patterns that work
- [ ] Identify content gaps and opportunities

#### Phase 2: Technical SEO Enhancements (Week 2)

**2.1 Enhanced Schema Markup**

- [ ] Add comprehensive JSON-LD structured data:
  - Person schema for Danny's profile
  - Article schema with author, publisher, dateModified
  - Organization schema for consulting work
  - Breadcrumb navigation schema
- [ ] Implement recipe for "How-to" articles
- [ ] Add FAQ schema for relevant content

**2.2 Meta Tag Optimization**

- [ ] Create template system for different content types:
  - Articles: "[Title] | Danny Smith - [Category] Expert"
  - Notes: "[Title] | Quick Take by Danny Smith"
  - Pages: "[Page] | Danny Smith - Remote Work Consultant"
- [ ] Implement dynamic meta descriptions based on content excerpts
- [ ] Add meta robots tags for content management
- [ ] Optimize Open Graph titles to be social-media friendly

**2.3 URL and Navigation Improvements**

- [ ] Review URL structure for SEO-friendliness
- [ ] Ensure proper internal linking between related content
- [ ] Add "Related Articles" functionality for better content discovery
- [ ] Implement breadcrumb navigation

#### Phase 3: Content Optimization (Week 3)

**3.1 Site-Wide Pages**

- [ ] Homepage: Optimize for "Danny Smith" + "remote work consultant"

  - Title: "Danny Smith | Remote Work Consultant & Organizational Health Expert"
  - Description: "Expert consultant helping companies build healthy remote teams and optimize operations. Leadership coaching, process optimization, and organizational development."

- [ ] Writing Index: Target "remote work articles" + "leadership insights"

  - Title: "Leadership & Remote Work Articles | Danny Smith"
  - Description: "In-depth articles on remote work, organizational health, leadership, and business operations by consultant Danny Smith."

- [ ] Notes Index: Target "quick insights" + "business observations"

  - Title: "Business Insights & Quick Takes | Danny Smith"
  - Description: "Short-form thoughts and observations on remote work, technology, and business operations."

- [ ] Now Page: Optimize for "what Danny Smith is doing now"
  - Title: "What I'm Doing Now | Danny Smith"
  - Description: "Current projects and focus areas for remote work consultant Danny Smith. Updated regularly with latest activities and interests."

**3.2 Article Optimization**

- [ ] Organizational Health article - optimize for "organizational health consultant"
- [ ] Remote work articles - target "remote work best practices"
- [ ] Leadership articles - focus on "leadership coaching" keywords
- [ ] Technical articles - leverage "CTO consultant" angle

**3.3 Meta Description Templates**
Create templates for consistent, compelling descriptions:

- Articles: "Learn [main benefit] in this guide by remote work consultant Danny Smith. [Key takeaway] plus actionable insights for [target audience]."
- Notes: "Quick insight from Danny Smith on [topic]. [Main point] based on [years] of consulting experience."

#### Phase 4: Advanced SEO Features (Week 4)

**4.1 Rich Snippets Optimization**

- [ ] Add estimated reading time to article schema
- [ ] Implement article rating/review schema where appropriate
- [ ] Add author bio schema with social profiles
- [ ] Create "How-to" schema for instructional content

**4.2 Social Media Optimization**

- [ ] Optimize Open Graph images for better social sharing
- [ ] Create Twitter Card templates for different content types
- [ ] Add LinkedIn-specific optimizations
- [ ] Implement social media meta tag testing

**4.3 Performance & Technical**

- [ ] Audit and optimize meta tag loading order
- [ ] Implement dynamic meta tag generation for better performance
- [ ] Add meta tag validation and testing tools
- [ ] Set up Search Console monitoring for rich snippets

#### Phase 5: Content Strategy & Ongoing Optimization

**5.1 Content Gap Analysis**

- [ ] Identify high-value keywords Danny could target with new content
- [ ] Plan content calendar based on SEO opportunities
- [ ] Create cornerstone content strategy around Danny's expertise

**5.2 Monitoring & Maintenance**

- [ ] Set up Google Search Console monitoring
- [ ] Implement monthly SEO audits
- [ ] Track key metrics: organic traffic, click-through rates, rankings
- [ ] Create process for ongoing meta tag optimization

### Success Metrics

**Primary KPIs:**

- Organic search traffic increase (target: +40% in 6 months)
- Click-through rate improvement from search results (target: +25%)
- Ranking improvements for target keywords
- Rich snippet appearances in search results

**Secondary KPIs:**

- Social media engagement from improved sharing cards
- Time on site and bounce rate improvements
- Internal link click-through rates
- Brand search volume increase

### Implementation Priority

**High Priority (Complete First):**

1. Fix missing meta descriptions on key articles
2. Optimize homepage and main page titles/descriptions
3. Implement proper schema markup for articles
4. Add comprehensive meta robots tags

**Medium Priority:**

1. Create content-specific meta tag templates
2. Enhance Open Graph optimizations
3. Implement breadcrumb navigation and schema
4. Optimize URL structure where needed

**Lower Priority (Nice to Have):**

1. Advanced rich snippets (FAQ, How-to)
2. Social media-specific optimizations
3. Performance optimizations for meta tags
4. Automated SEO testing and monitoring

### Estimated Timeline: 4-6 weeks

This plan balances technical SEO best practices with content strategy that leverages Danny's expertise in remote work, organizational health, and leadership consulting. The focus is on making the site more discoverable for people searching for these services while maintaining the personal, authentic voice of the brand.

## Task 5 - Sort RSS feeds

## Task 6 - Upgrade Astro

## Task 7 - Check sitemap, add analytics and google tag manager

### Implementation Breakdown: What Cursor Can Do vs What Needs Danny's Input

#### 🤖 What Cursor Can Implement Directly

**Technical SEO Implementation:**

- [ ] Add comprehensive JSON-LD structured data to BaseHead.astro
- [ ] Create meta tag templates for different content types in layouts
- [ ] Implement breadcrumb navigation component and schema
- [ ] Add meta robots tags for content management
- [ ] Enhance OpenGraph and Twitter Card implementations
- [ ] Add estimated reading time to article schema markup
- [ ] Implement author bio schema with social profiles
- [ ] Create FAQ and How-to schema templates for future use
- [ ] Optimize meta tag loading order and performance
- [ ] Add meta tag validation utilities

**Content Auditing & Analysis:**

- [ ] Scan all articles for missing meta descriptions
- [ ] Identify content with missing/generic titles
- [ ] Analyze current URL structure for SEO-friendliness
- [ ] Audit internal linking patterns
- [ ] Generate reports on content optimization opportunities
- [ ] Create spreadsheet of current meta tag status

**Code Enhancements:**

- [ ] Build dynamic meta description generation from content excerpts
- [ ] Create "Related Articles" component for better internal linking
- [ ] Implement social media meta tag testing utilities
- [ ] Add Search Console monitoring setup code
- [ ] Create automated SEO audit tooling

**Template & Component Creation:**

- [ ] Build reusable schema markup components
- [ ] Create meta tag testing and preview components
- [ ] Implement breadcrumb navigation system
- [ ] Build social sharing optimization components

#### 🧠 What Needs Danny's Strategic Input

**Brand & Keyword Strategy:**

- [ ] Define primary keyword targets for your expertise areas
- [ ] Decide on brand positioning: "Remote Work Consultant" vs "Organizational Health Expert" vs other focus
- [ ] Choose which content categories to prioritize for SEO
- [ ] Define your unique value propositions for search

**Content Strategy Decisions:**

- [ ] Review and approve suggested meta descriptions for key articles
- [ ] Decide which articles to optimize first (business priority)
- [ ] Choose target keywords for each major piece of content
- [ ] Define your ideal search personas and what they're looking for

**Business Goals & Priorities:**

- [ ] Set SEO success metrics that align with your business goals
- [ ] Decide on content calendar and new article topics
- [ ] Choose which services/expertise to emphasize in SEO
- [ ] Define geographic targeting (UK focus? Global?)

**Editorial Review:**

- [ ] Review and refine meta titles and descriptions I draft
- [ ] Approve schema markup data about yourself/your business
- [ ] Choose which social profiles to include in structured data
- [ ] Decide on breadcrumb navigation structure

#### 🚀 Suggested Immediate Action Plan

**Phase 1: Cursor Does Technical Setup (1-2 days)**

1. Implement comprehensive schema markup
2. Create meta tag templates and dynamic generation
3. Add breadcrumb navigation
4. Audit current content and generate reports
5. Build related articles system

**Phase 2: Danny's Strategic Input (30-60 minutes)**

1. Review content audit results
2. Define 5-10 primary keywords to target
3. Choose brand positioning focus
4. Approve/edit suggested meta descriptions for top 10 articles

**Phase 3: Cursor Implements Strategy (1 day)**

1. Apply approved meta descriptions
2. Optimize titles based on keyword strategy
3. Implement internal linking improvements
4. Set up monitoring and testing tools
