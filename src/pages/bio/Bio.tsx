import Image from '@/components/Image';
import PageHeading from '@/components/PageHeading';
import { Page, PageSection } from '@/layout';
import PageCard from '@/layout/PageCard';
import { buildSrc } from '@/lib/media';
import { cn } from '@/lib/utils';

import type { SrcAndSources } from '@/components/Image';

export default function Bio({ background }: { background: SrcAndSources }) {
  return (
    <Page className='flex-col items-center gap-12 relative'>
      <div>
        <Image className='fixed top-10 left-0 -z-10 brightness-60' {...background} />
      </div>
      <PageHeading>Bio</PageHeading>
      <PageCard>
        <PageSection className="flex flex-col gap-20 text-lg">
          <BioSection name="Jeff Boxell" beatleName="John Lennon" image={"jeff.avif"} imageAlt="Jeff Boxell performing">
            <p className="leading-relaxed">
              Jeff Boxell, born in Minneapolis, Minnesota, is a singer, songwriter, performer, actor, and author who also works in public education supporting children with special needs. Music and entertainment shaped his life early, with John Lennon standing as one of his deepest influences alongside artists such as Buddy Holly, Elvis Presley, Cat Stevens, Simon & Garfunkel, James Taylor, Rush, and Pink Floyd.
            </p>
            <p className="leading-relaxed">
              Jeff began singing at age 3, picked up guitar at 9, and was performing publicly by 12 on the streets of Minneapolis. Since 1980, he has toured nationally as a singer, bassist, and guitarist with bands including The Crow River Gambler's, Casa Blanca, Chaser, No Warning, Ecstatic, Wise Guy, The Banger's All American Band, The Shadow's Tribute Band, and A Hard Day's Night Tribute Band.
            </p>
            <p className="leading-relaxed">
              He has also shared stages with many notable acts, including The Hollies, Frank Sinatra Jr., John Ford Coley, and Rick Derringer. Jeff says his love of The Beatles and the musicianship of A Hard Day's Night continue to inspire him to keep this music alive for future generations.
            </p>
          </BioSection>
        </PageSection>
      </PageCard>
      <PageCard>
        <PageSection className="flex flex-col gap-20 text-lg">
          <BioSection name="Joe Covert" beatleName="Paul McCartney" image={"joe.avif"} imageAlt="Joe Covert performing" reverse={true}>
            <p className="leading-relaxed">
              Joe Covert, leader of A Hard Day's Night, is a thirty-year music veteran from South Minneapolis whose roots in music run deep. His grandfather, Ray Covert, was a professional musician who later toured with the USO during World War II and even played at the Warwick Hotel in New York, where the Beatles stayed before their Ed Sullivan Show appearance. Raised in a family that encouraged music, Joe began playing at 14 and formed his first bands with neighborhood friends.
            </p>
            <p className="leading-relaxed">
              In the early 1980s, Joe found his musical calling busking on Nicollet Mall and at Calhoun Square, then went full-time in 1986 with Ready Steady Go! and later performed with successful cover bands including Royal Royal and Wallstreet. He also became a high school teacher and formed the student band Covert Ops. In 2006, Joe helped found A Hard Day's Night, bringing his lifelong passion for the Beatles to audiences across the Midwest.
            </p>
          </BioSection>
        </PageSection>
      </PageCard>
      <PageCard>
        <PageSection className="flex flex-col gap-20 text-lg">
          <BioSection name="Aron Helm" beatleName="George Harrison" image={"aron.avif"} imageAlt="Aron Helm performing">
            <p className="leading-relaxed">
              Aron Helm grew up surrounded by music, with a touring musician father and an accomplished singer for a mother. He sang in elementary school choir, played trumpet for veterans at age 11, and spent much of his early life on drums, in church music, and in school band. Though athletics pulled him away from music through high school and college, including four years of college baseball and a brief opportunity with the Saint Paul Saints, he returned to music at 22 and discovered a passion for guitar. What began as casual jams with his brother-in-law soon turned into band practices, live shows, and a serious commitment to studying guitar technique and music theory.
            </p>
            <p className="leading-relaxed">
              After sharpening his skills, Aron returned to performing and played in a variety of local country and rock cover bands as both a lead singer and lead guitarist, appearing at metro venues, town fairs, festivals, and even Winstock. In 2015, he took on a new challenge by auditioning for a Beatles tribute band as George Harrison. Though he had long loved the Beatles, stepping into George's role gave him a new appreciation for Harrison's talent as a musician and songwriter. Since officially joining the band in May 2015, Aron has become known for faithfully capturing George's voice, playing style, and presence on stage.
            </p>
          </BioSection>
        </PageSection>
      </PageCard>
      <PageCard>
        <PageSection className="flex flex-col gap-20 text-lg">
          <BioSection name="Kevin Fransen" beatleName="Ringo Starr" image={"kevin.avif"} imageAlt="Kevin Fransen performing" reverse={true}>
            <p className="leading-relaxed">
              Kevin knew early on that music would define his life. As a kid, he was immersed in rock, with walls covered in KISS posters and a stereo blasting Ted Nugent and Van Halen. After discovering a drum set at a friend's house, he taught himself his first beats and soon bought his own kit with lawn mowing money. He took lessons, played in bands through high school, and studied with respected drummers who broadened his understanding of rhythm, technique, and musicality. His early career took him from circus performances, where he learned dynamics and precision, to country and rock bands across the Twin Cities and beyond, eventually earning the nickname “Hevy Kevy.”
            </p>
            <p className="leading-relaxed">
              Over the years, Kevin built a wide-ranging career in rock, metal, and country bands, developing not only as a drummer but also as a lead vocalist. After fronting To The Core and refining his singing in groups like Larry Loftus and the Wild Horses, he stepped away briefly before finding a new fit in Beatles music. What once seemed unlikely quickly made perfect sense, as his background in jazz rhythms, dynamic live performance, and varied percussion styles aligned naturally with Ringo Starr's playing. Kevin takes pride in recreating the feel, fills, and distinct drum sounds of each Beatles era, bringing both precision and energy to every performance.
            </p>
          </BioSection>
        </PageSection>
      </PageCard>
    </Page >
  )
}

function BioSection({ children, name, beatleName, image, reverse = false, imageAlt = "" }: { children: React.ReactNode, name: string, beatleName: string, image: string, reverse?: boolean, imageAlt?: string }) {
  return (
    <div
      className="flex gap-8"
      style={{ flexDirection: reverse ? "row-reverse" : "row" }}
    >
      <div className={cn(
        "flex-2/7 shrink-0 mb-4 flex flex-col items-center font-ahdn uppercase",
      )}>
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight">{name}</h2>
          <p className="text-xl font-semibold text-gray-600 my-2">{`"${beatleName}"`}</p>
        </div>
        <img
          src={buildSrc(image)}
          alt={imageAlt}
          className="w-full rounded-md"
        />
      </div>
      <div className='flex flex-col justify-center gap-4'>
        {children}
      </div>
    </div>
  )
}
