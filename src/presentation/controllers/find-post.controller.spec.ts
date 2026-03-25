import { describe, it, beforeEach, expect } from "bun:test";
import { bootstrap } from "../dev/bootstrap";
import { faker } from "@faker-js/faker";
import { treaty } from "@elysiajs/eden";
import { generateUUID } from "@roastery/beans/entity/helpers";
import { PostTag } from "@roastery-capsules/post.post-tag/domain";
import { PostType } from "@roastery-capsules/post.post-type/domain";
import { CreatePostDTO } from "@/application/dtos";
import { Schema } from "@roastery/terroir/schema";

type App = Awaited<ReturnType<typeof bootstrap>>;

const TAG = PostTag.make({ name: "Tech" });
const TYPE = PostType.make({
	name: "Blog",
	schema: Schema.make(CreatePostDTO).toString(),
});

function makeBody(overrides?: Record<string, unknown>) {
	return {
		postTypeId: TYPE.id,
		tags: [TAG.id],
		name: faker.lorem.words(3),
		description: faker.lorem.sentence(),
		cover: faker.image.url(),
		...overrides,
	};
}

describe("FindPostController", () => {
	let server: App;
	let api: ReturnType<typeof treaty<App>>;
	let env: App["decorator"]["env"];

	beforeEach(async () => {
		server = await bootstrap();
		await (
			server.decorator.cache as unknown as { flushall: () => Promise<void> }
		).flushall();

		// biome-ignore lint/suspicious/noExplicitAny: acesso aos repositórios de teste para seed
		const decorator = server.decorator as any;
		decorator.postTagRepositoryForPost.seed([TAG]);
		decorator.postTypeRepositoryForPost.seed([TYPE]);

		api = treaty<typeof server>(server);
		env = server.decorator.env;
	});

	async function authenticate() {
		const { AUTH_EMAIL: email, AUTH_PASSWORD: password } = env;
		const auth = await api.auth.login.post({ email, password });
		const cookies = auth.response.headers.getSetCookie();
		return { headers: { cookie: cookies.join("; ") } };
	}

	async function createPost() {
		const options = await authenticate();
		const { data } = await api.posts.post(makeBody(), options);
		return data as { id: string; slug: string };
	}

	it("should find a post by ID", async () => {
		const created = await createPost();

		const { status, data } = await api
			.posts({ "id-or-slug": created.id })
			.get();

		expect(status).toBe(200);
		expect(data?.id).toBe(created.id);
	});

	it("should find a post by slug", async () => {
		const created = await createPost();

		const { status, data } = await api
			.posts({ "id-or-slug": created.slug })
			.get();

		expect(status).toBe(200);
		expect(data?.slug).toBe(created.slug);
	});

	it("should return 404 for a non-existent post", async () => {
		const { status } = await api.posts({ "id-or-slug": generateUUID() }).get();

		expect(status).toBe(404);
	});

	it("should not require authentication", async () => {
		const created = await createPost();

		const { status } = await api.posts({ "id-or-slug": created.id }).get();

		expect(status).toBe(200);
	});

	it("should return the full post payload", async () => {
		const created = await createPost();

		const { data } = await api.posts({ "id-or-slug": created.id }).get();

		expect(data?.id).toBeDefined();
		expect(data?.slug).toBeDefined();
		expect(data?.createdAt).toBeDefined();
	});
});
