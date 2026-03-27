import PostTags from "../tags";
import PostTypeTags from "@roastery-capsules/post.post-type/presentation/tags";
import PostTagTags from "@roastery-capsules/post.post-tag/presentation/tags";
import {
	makePostRepository,
	makePostTagRepository as makePostTagRepositoryForPost,
	makePostTypeRepository as makePostTypeRepositoryForPost,
} from "@/infra/factories/repositories";
import { PostRoutes } from "../routes";
import { PostDependenciesDTO } from "@/infra/dependencies";
import { PostTagDependenciesDTO } from "@roastery-capsules/post.post-tag/infra/dependencies";
import { PostTypeDependenciesDTO } from "@roastery-capsules/post.post-type/infra/dependencies";
import { PostRepositoryPlugin } from "../plugins";
import type {
	IPostRepository,
	IPostTagRepository as IPostTagRepositoryForPost,
	IPostTypeRepository as IPostTypeRepositoryForPost,
} from "@/domain/types/repositories";
import { barista } from "@roastery/barista";
import { CacheEnvDependenciesDTO } from "@roastery-adapters/cache/dtos";
import { AuthEnvDependenciesDTO } from "@roastery-capsules/auth/dtos";
import { GetAccessController } from "@roastery-capsules/auth/plugins/controllers";
import BaristaAuthTags from "@roastery-capsules/auth/plugins/tags";
import { baristaEnv } from "@roastery-capsules/env";
import { baristaErrorHandler } from "@roastery-capsules/api-error-handler";
import { baristaResponseMapper } from "@roastery-capsules/api-response-mapper";
import { cache } from "@roastery-adapters/cache";
import { postAdapter as baristaPostAdapter } from "@roastery-adapters/post/plugins";
import { baristaApiDocs } from "@roastery-capsules/api-docs";
import { UnknownException } from "@roastery/terroir/exceptions";
import { PostTagRoutes } from "@roastery-capsules/post.post-tag/presentation/routes";
import type { IPostTagRepository } from "@roastery-capsules/post.post-tag/domain/types";
import type { IPostTypeRepository } from "@roastery-capsules/post.post-type/domain/types";
import { PostTagRepositoryPlugin } from "@roastery-capsules/post.post-tag/presentation/plugins";
import { PostTypeRepositoryPlugin } from "@roastery-capsules/post.post-type/presentation/plugins";
import { makePostTagRepository } from "@roastery-capsules/post.post-tag/infra/factories/repositories";
import { makePostTypeRepository } from "@roastery-capsules/post.post-type/infra/factories/repositories";
import { PostTypeRoutes } from "@roastery-capsules/post.post-type/presentation/routes";

export async function bootstrap(open: boolean = false) {
	const app = barista({ name: "@roastery" })
		.use(
			baristaEnv(
				CacheEnvDependenciesDTO,
				AuthEnvDependenciesDTO,
				PostDependenciesDTO,
				PostTagDependenciesDTO,
				PostTypeDependenciesDTO,
			),
		)
		.use(baristaErrorHandler)
		.use(baristaResponseMapper)
		.use((app) => {
			const { CACHE_PROVIDER, REDIS_URL } = app.decorator.env;

			return app.use(cache({ CACHE_PROVIDER, REDIS_URL }));
		});

	const { env } = app.decorator;
	const {
		AUTH_EMAIL,
		AUTH_PASSWORD,
		JWT_SECRET,
		DATABASE_URL,
		DATABASE_PROVIDER,
		PORT,
		NODE_ENV,
		CACHE_PROVIDER,
		REDIS_URL,
		POST_TAG_BASE_URL,
		POST_TYPE_BASE_URL,
	} = env;

	let postRepository: IPostRepository;

	const postTagRepositoryForPost: IPostTagRepositoryForPost =
		makePostTagRepositoryForPost({
			baseUrl: POST_TAG_BASE_URL ?? `http://localhost:${PORT}`,
			target: POST_TAG_BASE_URL ? "API" : "MEMORY",
		});
	const postTypeRepositoryForPost: IPostTypeRepositoryForPost =
		makePostTypeRepositoryForPost({
			baseUrl: POST_TYPE_BASE_URL ?? `http://localhost:${PORT}`,
			target: POST_TYPE_BASE_URL ? "API" : "MEMORY",
		});
	let postTagRepository: IPostTagRepository;
	let postTypeRepository: IPostTypeRepository;

	if (DATABASE_URL && DATABASE_PROVIDER === "PRISMA") {
		const postAdapter = await baristaPostAdapter(DATABASE_URL);

		app.use(postAdapter).use((app) => {
			const { postPrismaClient: prismaClient, cache } = app.decorator;

			postRepository = makePostRepository({
				cache,
				prismaClient,
				target: DATABASE_PROVIDER,
			});

			postTypeRepository = makePostTypeRepository({
				cache,
				prismaClient,
				target: DATABASE_PROVIDER,
			});

			postTagRepository = makePostTagRepository({
				cache,
				prismaClient,
				target: DATABASE_PROVIDER,
			});

			return app
				.use(
					PostRepositoryPlugin(
						postRepository,
						postTagRepositoryForPost,
						postTypeRepositoryForPost,
					),
				)
				.use(PostTagRepositoryPlugin(postTagRepository))
				.use(PostTypeRepositoryPlugin(postTypeRepository));
		});
	} else {
		app.use((app) => {
			const { cache } = app.decorator;

			postRepository = makePostRepository({
				cache,
				target: "MEMORY",
			});

			postTypeRepository = makePostTypeRepository({
				cache,
				target: "MEMORY",
			});

			postTagRepository = makePostTagRepository({
				cache,
				target: "MEMORY",
			});

			return app
				.use(
					PostRepositoryPlugin(
						postRepository,
						postTagRepositoryForPost,
						postTypeRepositoryForPost,
					),
				)
				.use(PostTagRepositoryPlugin(postTagRepository))
				.use(PostTypeRepositoryPlugin(postTypeRepository));
		});
	}

	if (!postRepository!) throw new UnknownException();
	if (!postTagRepository!) throw new UnknownException();
	if (!postTypeRepository!) throw new UnknownException();

	return app
		.use(
			GetAccessController({
				AUTH_EMAIL,
				AUTH_PASSWORD,
				JWT_SECRET,
				CACHE_PROVIDER,
				REDIS_URL,
			}),
		)
		.use((app) => {
			const { env } = app.decorator;
			const { CACHE_PROVIDER, JWT_SECRET, REDIS_URL } = env;
			return app
				.use(
					PostTagRoutes({
						cacheProvider: CACHE_PROVIDER,
						jwtSecret: JWT_SECRET,
						repository: postTagRepository,
						redisUrl: REDIS_URL,
					}),
				)
				.use(
					PostTypeRoutes({
						cacheProvider: CACHE_PROVIDER,
						jwtSecret: JWT_SECRET,
						redisUrl: REDIS_URL,
						repository: postTypeRepository,
					}),
				)
				.use(
					PostRoutes({
						cacheProvider: CACHE_PROVIDER,
						jwtSecret: JWT_SECRET,
						postRepository,
						postTagRepository: postTagRepositoryForPost,
						postTypeRepository: postTypeRepositoryForPost,
						redisUrl: REDIS_URL,
					}),
				);
		})
		.use(
			baristaApiDocs(NODE_ENV === "DEVELOPMENT", `http://localhost:${PORT}`, {
				info: {
					title: "Roastery",
					version: "1.0",
					contact: {
						email: "alanreisanjo@gmail.com",
						name: "Alan Reis",
						url: "https://hoyasumii.dev",
					},
					description:
						"A RESTful API for managing Post Types within the Roastery CMS platform. This microservice is responsible for creating, retrieving, updating, and deleting Post Types, handling global uniqueness through slugs, schema management for diverse content structures, and toggleable highlight states.",
				},
				tags: [BaristaAuthTags, PostTags, PostTypeTags, PostTagTags],
			}),
		)
		.use((app) => {
			if (open) {
				app.listen(app.decorator.env.PORT, () => {
					console.log(
						`☕️ Server is running at: http://localhost:${app.decorator.env.PORT}`,
					);
				});
			}
			return app;
		});
}
