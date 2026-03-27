# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2026-03-26

### Changed

- `PostTypeRoutes` renamed to `PostRoutes` in `src/presentation/routes/index.ts`
- Bootstrap restructured to integrate `post.post-tag` and `post.post-type` capsules as standalone services, separating "ForPost" (API) repositories from direct capsule repositories (Prisma/Memory)
- Added `PostTagDependenciesDTO` and `PostTypeDependenciesDTO` to bootstrap env configuration
- Added `PostTagRepositoryPlugin`, `PostTypeRepositoryPlugin`, `PostTagRoutes` and `PostTypeRoutes` from their respective capsules in bootstrap
- API docs tags now include `PostTags`, `PostTypeTags` and `PostTagTags`
- `PostRepository.update` now explicitly destructures fields instead of spreading all properties
- Renamed barista app from `@caffeine` to `@roastery` and updated API docs title/description from `Caffeine` to `Roastery`
- `@roastery-adapters/cache` bumped from `^0.0.4` to `^0.0.5`
- `@roastery-capsules/post.post-tag` bumped from `^0.0.2` to `^0.0.4`
- `@roastery-capsules/post.post-type` bumped from `0.0.2` to `0.0.3`
- `@roastery/beans` bumped from `0.0.3` to `0.0.4`

### Fixed

- Date serialization in `PostTagRepository` and `PostTypeRepository`: `createdAt` and `updatedAt` are now converted to ISO string before creating the entity
- Removed non-null assertion (`data!`) in `PostTagRepository.findBySlug`
