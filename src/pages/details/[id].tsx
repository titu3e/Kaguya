import CharacterCard from "@/components/seldom/CharacterCard";
import DetailsBanner from "@/components/seldom/DetailsBanner";
import DetailsSection from "@/components/seldom/DetailsSection";
import InfoItem from "@/components/seldom/InfoItem";
import AnimeList from "@/components/shared/AnimeList";
import Button from "@/components/shared/Button";
import DotList from "@/components/shared/DotList";
import Head from "@/components/shared/Head";
import PlainAnimeCard from "@/components/shared/PlainAnimeCard";
import dayjs from "@/lib/dayjs";
import supabase from "@/lib/supabase";
import { Anime } from "@/types";
import { isColorVisible, numberWithCommas } from "@/utils";
import { convert } from "@/utils/anime";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import React from "react";
import { BsFillPlayFill } from "react-icons/bs";

interface DetailsPageProps {
  anime: Anime;
}

const DetailsPage: NextPage<DetailsPageProps> = ({ anime }) => {
  const nextAiringSchedule = anime.airing_schedule.length
    ? anime.airing_schedule.find((schedule) =>
        dayjs.unix(schedule.airing_at).isAfter(dayjs())
      )
    : null;

  return (
    <React.Fragment>
      <Head
        title={anime.title.user_preferred}
        description={`Xem anime ${anime.title.user_preferred} ngay tại Kaguya!`}
        image={anime.banner_image}
      />

      <div className="pb-8">
        <DetailsBanner image={anime.banner_image} />

        <div className="relative px-4 sm:px-12 z-10 bg-background-900 pb-4">
          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className="flex-shrink-0 relative left-1/2 -translate-x-1/2 md:static md:left-0 md:-translate-x-0 w-[186px] -mt-20">
              <PlainAnimeCard anime={anime} />
            </div>

            <div className="text-center md:text-left flex flex-col items-center md:items-start py-4 mt-4 md:-mt-16">
              <Button primary LeftIcon={BsFillPlayFill} className="mb-8">
                <p>Xem ngay</p>
              </Button>

              <p className="text-3xl font-semibold mb-2">
                {anime.title.user_preferred}
              </p>

              <DotList>
                {anime.genres.map((genre) => (
                  <p key={genre}>{convert(genre, "genre")}</p>
                ))}
              </DotList>

              <p className="mt-4 text-gray-300">{anime.description}</p>

              <div className="flex items-center gap-8 md:gap-x-16 mt-8">
                <InfoItem title="Số tập" value={anime.total_episodes} />
                <InfoItem title="Thời lượng" value={`${anime.duration} phút`} />
                <InfoItem
                  title="Tình trạng"
                  value={convert(anime.status, "status")}
                />
                <InfoItem
                  title="Giới hạn tuổi"
                  value={anime.is_adult ? "18+" : ""}
                />
                <InfoItem
                  className="!text-primary-300"
                  title="Tập tiếp theo"
                  value={`Tập ${nextAiringSchedule.episode}: ${dayjs
                    .unix(nextAiringSchedule.airing_at)
                    .fromNow()}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:space-y-0 px-4 md:grid md:grid-cols-10 w-full min-h-screen mt-8 sm:px-12 gap-8">
          <div className="md:col-span-2 bg-background-900 rounded-md p-4 space-y-4 h-[max-content]">
            <InfoItem
              title="Định dạng"
              value={convert(anime.format, "format")}
            />
            <InfoItem title="English" value={anime.title.english} />
            <InfoItem title="Native" value={anime.title.native} />
            <InfoItem title="Romanji" value={anime.title.romaji} />
            <InfoItem
              title="Nổi bật"
              value={numberWithCommas(anime.popularity)}
            />
            <InfoItem
              title="Yêu thích"
              value={numberWithCommas(anime.favourites)}
            />
            <InfoItem
              title="Xu hướng"
              value={numberWithCommas(anime.trending)}
            />
            <InfoItem
              title="Studio"
              value={anime.studios.slice(0, 3).join(", ")}
            />
            <InfoItem
              title="Mùa"
              value={`${convert(anime.season, "season")} ${anime.season_year}`}
            />
          </div>
          <div className="md:col-span-8 space-y-12">
            {!!anime?.characters?.length && (
              <DetailsSection
                title="Nhân vật"
                className="w-full grid md:grid-cols-2 grid-cols-1 gap-4"
              >
                {anime.characters.map((character, index) => (
                  <CharacterCard character={character} key={index} />
                ))}
              </DetailsSection>
            )}

            {!!anime?.relations?.length && (
              <DetailsSection title="Anime liên quan">
                <AnimeList
                  data={anime.relations.map((relation) => relation.anime)}
                />
              </DetailsSection>
            )}

            {!!anime?.recommendations?.length && (
              <DetailsSection title="Anime hay khác">
                <AnimeList
                  data={anime.recommendations.map(
                    (recommendation) => recommendation.anime
                  )}
                />
              </DetailsSection>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { data, error } = await supabase
    .from("anime")
    .select(
      `
        *,
        airing_schedule(*),
        characters(*),
        recommendations!original_id(anime:recommend_id(*)),
        relations!original_id(anime:relation_id(*))
      `
    )
    .eq("ani_id", Number(params.id))
    .single();

  if (error) {
    return { notFound: true };
  }

  return {
    props: {
      anime: data as Anime,
    },
    revalidate: 43200, // 12 hours
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await supabase.from("anime").select("ani_id");

  const paths = data.map((anime: Anime) => ({
    params: { id: anime.ani_id.toString() },
  }));

  return { paths, fallback: "blocking" };
};

export default DetailsPage;
